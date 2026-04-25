"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ItemFormValues } from "../schemas/item-schema"

// ─── Items ───────────────────────────────────────────────────────────────────

export async function getItems(categoryId?: string) {
    try {
        const items = await prisma.item.findMany({
            where: {
                deletedAt: null,
                ...(categoryId && { categoryId }),
            },
            include: {
                category: true,
            },
            orderBy: { name: "asc" },
        })
        return items
    } catch (error) {
        console.error("Error fetching items:", error)
        throw new Error("Failed to fetch items")
    }
}

export async function getItemById(id: string) {
    try {
        const item = await prisma.item.findUnique({
            where: { id },
            include: { category: true },
        })
        return item
    } catch (error) {
        console.error("Error fetching item:", error)
        throw new Error("Failed to fetch item")
    }
}

export async function createItem(data: ItemFormValues) {
    try {
        const item = await prisma.item.create({
            data: {
                itemCode: data.itemCode,
                name: data.itemCode, // Auto-mapping name to itemCode
                description: data.description,
                categoryId: data.categoryId,
                unit: data.unit,
                hsnCode: data.hsnCode,
                gstRate: data.gstRate,
                purchasePrice: data.purchasePrice,
                salePrice: data.salePrice,
                openingStock: data.openingStock,
                currentStock: data.currentStock || data.openingStock,
                lowStockAlert: data.lowStockAlert,
                imageUrl: data.imageUrl,
            },
        })
        revalidatePath("/dashboard/inventory")
        return { success: true, data: item }
    } catch (error: any) {
        console.error("Error creating item:", error)
        if (error?.code === "P2002") {
            return { success: false, error: "Item code already exists" }
        }
        return { success: false, error: "Failed to create item" }
    }
}

export async function updateItem(id: string, data: Partial<ItemFormValues>) {
    try {
        const item = await prisma.item.update({
            where: { id },
            data: { ...data, name: data.itemCode }, // Keep name in sync with itemCode
        })
        revalidatePath("/dashboard/inventory")
        return { success: true, data: item }
    } catch (error: any) {
        console.error("Error updating item:", error)
        if (error?.code === "P2002") {
            return { success: false, error: "Item code already exists" }
        }
        return { success: false, error: "Failed to update item" }
    }
}

export async function deleteItem(id: string) {
    try {
        const item = await prisma.item.findUnique({ where: { id } })
        if (!item || item.deletedAt) return { success: true }
        
        await prisma.item.update({
            where: { id },
            data: { 
                deletedAt: new Date(),
                itemCode: item.itemCode ? `${item.itemCode}-deleted-${Date.now()}` : null 
            },
        })
        revalidatePath("/dashboard/inventory")
        return { success: true }
    } catch (error) {
        console.error("Error deleting item:", error)
        return { success: false, error: "Failed to delete item" }
    }
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
    try {
        const categories = await prisma.itemCategory.findMany({
            where: { deletedAt: null },
            orderBy: { name: "asc" },
            include: {
                _count: { select: { items: { where: { deletedAt: null } } } },
            },
        })
        return categories
    } catch (error) {
        console.error("Error fetching categories:", error)
        throw new Error("Failed to fetch categories")
    }
}

export async function createCategory(name: string) {
    try {
        const category = await prisma.itemCategory.create({
            data: { name },
        })
        revalidatePath("/dashboard/inventory")
        return { success: true, data: category }
    } catch (error) {
        console.error("Error creating category:", error)
        return { success: false, error: "Failed to create category" }
    }
}

export async function deleteCategory(id: string) {
    try {
        await prisma.itemCategory.update({
            where: { id },
            data: { deletedAt: new Date() },
        })
        revalidatePath("/dashboard/inventory")
        return { success: true }
    } catch (error) {
        console.error("Error deleting category:", error)
        return { success: false, error: "Failed to delete category" }
    }
}

// ─── Stock Summary ───────────────────────────────────────────────────────────

export async function getStockSummary() {
    try {
        const items = await prisma.item.findMany({
            where: { deletedAt: null },
            select: {
                currentStock: true,
                purchasePrice: true,
                salePrice: true,
                lowStockAlert: true,
            },
        })

        const totalItems = items.length
        const totalStockValueCost = items.reduce(
            (sum, item) => sum + item.currentStock * item.purchasePrice,
            0
        )
        const totalStockValueSale = items.reduce(
            (sum, item) => sum + item.currentStock * item.salePrice,
            0
        )
        const lowStockCount = items.filter(
            (item) => item.lowStockAlert > 0 && item.currentStock <= item.lowStockAlert && item.currentStock > 0
        ).length
        const outOfStockCount = items.filter((item) => item.currentStock <= 0).length

        return {
            totalItems,
            totalStockValueCost,
            totalStockValueSale,
            lowStockCount,
            outOfStockCount,
        }
    } catch (error) {
        console.error("Error fetching stock summary:", error)
        throw new Error("Failed to fetch stock summary")
    }
}

// ─── Stock Adjustments ───────────────────────────────────────────────────────

export async function adjustStock(
    itemId: string,
    movementType: "in" | "out",
    quantity: number,
    reason: string
) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Get current item
            const item = await tx.item.findUnique({ where: { id: itemId } })
            if (!item) throw new Error("Item not found")

            // Calculate new stock
            const newStock =
                movementType === "in"
                    ? item.currentStock + quantity
                    : item.currentStock - quantity

            if (newStock < 0) {
                throw new Error("Stock cannot go below zero")
            }

            // Update item stock
            await tx.item.update({
                where: { id: itemId },
                data: { currentStock: newStock },
            })

            // Create stock movement record
            const movement = await tx.stockMovement.create({
                data: {
                    itemId,
                    movementType,
                    quantity,
                    reason,
                    referenceType: "manual",
                },
            })

            return { newStock, movement }
        })

        revalidatePath("/dashboard/inventory")
        return { success: true, data: result }
    } catch (error: any) {
        console.error("Error adjusting stock:", error)
        return { success: false, error: error.message || "Failed to adjust stock" }
    }
}

export async function getStockMovements(itemId: string) {
    try {
        const movements = await prisma.stockMovement.findMany({
            where: { itemId },
            orderBy: { createdAt: "desc" },
            include: {
                item: { select: { name: true, unit: true } },
            },
        })
        return movements
    } catch (error) {
        console.error("Error fetching stock movements:", error)
        throw new Error("Failed to fetch stock movements")
    }
}
