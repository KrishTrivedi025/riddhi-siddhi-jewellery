"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ItemFormValues } from "../schemas/item-schema"
import { requireUserId } from "./auth-helper"

// ─── Items ───────────────────────────────────────────────────────────────────

export async function getItems(categoryId?: string) {
    try {
        const userId = await requireUserId()
        const items = await prisma.item.findMany({
            where: {
                userId,
                deletedAt: null,
                ...(categoryId && { categoryId }),
            },
            include: { category: true, priceComponents: { orderBy: { sortOrder: "asc" } } },
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
        const userId = await requireUserId()
        const item = await prisma.item.findFirst({
            where: { id, userId },
            include: { category: true, priceComponents: { orderBy: { sortOrder: "asc" } } },
        })
        return item
    } catch (error) {
        console.error("Error fetching item:", error)
        throw new Error("Failed to fetch item")
    }
}

export async function createItem(data: ItemFormValues) {
    try {
        const userId = await requireUserId()
        const item = await prisma.item.create({
            data: {
                userId,
                itemCode: data.itemCode,
                name: data.itemCode,
                description: data.description,
                categoryId: data.categoryId,
                unit: data.unit,
                hsnCode: data.hsnCode,
                gstRate: data.gstRate,
                purchasePrice: data.purchasePrice,
                salePrice: data.salePrice,
                weight: data.weight ?? null,
                openingStock: data.openingStock,
                currentStock: data.currentStock || data.openingStock,
                lowStockAlert: data.lowStockAlert,
                imageUrl: data.imageUrl,
                priceComponents: data.priceComponents?.length
                    ? { create: data.priceComponents.map((c, i) => ({ label: c.label, amount: c.amount, sortOrder: i })) }
                    : undefined,
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
        const userId = await requireUserId()
        const { priceComponents, ...rest } = data
        const item = await prisma.$transaction(async (tx) => {
            if (priceComponents) {
                await tx.itemPriceComponent.deleteMany({ where: { itemId: id } })
                if (priceComponents.length) {
                    await tx.itemPriceComponent.createMany({
                        data: priceComponents.map((c, i) => ({ itemId: id, label: c.label, amount: c.amount, sortOrder: i })),
                    })
                }
            }
            return tx.item.update({
                where: { id, userId },
                data: { ...rest, name: rest.itemCode },
            })
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
        const userId = await requireUserId()
        const item = await prisma.item.findFirst({ where: { id, userId } })
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
        const userId = await requireUserId()
        const categories = await prisma.itemCategory.findMany({
            where: { userId, deletedAt: null },
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
        const userId = await requireUserId()
        const category = await prisma.itemCategory.create({
            data: { name, userId },
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
        const userId = await requireUserId()
        await prisma.itemCategory.update({
            where: { id, userId },
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
        const userId = await requireUserId()
        const items = await prisma.item.findMany({
            where: { userId, deletedAt: null },
            select: {
                currentStock: true,
                purchasePrice: true,
                salePrice: true,
                lowStockAlert: true,
            },
        })

        const totalItems = items.length
        const totalStockValueCost = items.reduce((sum, item) => sum + item.currentStock * item.purchasePrice, 0)
        const totalStockValueSale = items.reduce((sum, item) => sum + item.currentStock * item.salePrice, 0)
        const lowStockCount = items.filter((item) => item.lowStockAlert > 0 && item.currentStock <= item.lowStockAlert && item.currentStock > 0).length
        const outOfStockCount = items.filter((item) => item.currentStock <= 0).length

        return { totalItems, totalStockValueCost, totalStockValueSale, lowStockCount, outOfStockCount }
    } catch (error) {
        console.error("Error fetching stock summary:", error)
        throw new Error("Failed to fetch stock summary")
    }
}

// ─── Stock Adjustments ───────────────────────────────────────────────────────

export async function adjustStock(itemId: string, movementType: "in" | "out", quantity: number, reason: string) {
    try {
        const userId = await requireUserId()
        const result = await prisma.$transaction(async (tx) => {
            const item = await tx.item.findFirst({ where: { id: itemId, userId } })
            if (!item) throw new Error("Item not found")

            const newStock = movementType === "in" ? item.currentStock + quantity : item.currentStock - quantity
            if (newStock < 0) throw new Error("Stock cannot go below zero")

            await tx.item.update({ where: { id: itemId }, data: { currentStock: newStock } })
            const movement = await tx.stockMovement.create({
                data: { itemId, movementType, quantity, reason, referenceType: "manual" },
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
            include: { item: { select: { name: true, unit: true } } },
        })
        return movements
    } catch (error) {
        console.error("Error fetching stock movements:", error)
        throw new Error("Failed to fetch stock movements")
    }
}
