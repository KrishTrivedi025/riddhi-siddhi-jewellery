"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { PurchaseReturnFormValues } from "../schemas/purchase-return-schema"
import { calculateLineItemGST } from "../gst-utils"
import { isInterState } from "../indian-states"
import { requireUserId } from "./auth-helper"

// ─── List Purchase Returns ───────────────────────────────────────────────────

export async function getPurchaseReturns() {
    try {
        const userId = await requireUserId()
        const returns = await prisma.purchaseReturn.findMany({
            where: { userId, deletedAt: null },
            include: {
                party: { select: { id: true, name: true } },
                purchaseInvoice: { select: { id: true, invoiceNumber: true } },
                items: true,
            },
            orderBy: { createdAt: "desc" },
        })
        return returns
    } catch (error) {
        console.error("Error fetching purchase returns:", error)
        throw new Error("Failed to fetch purchase returns")
    }
}

// ─── Get Purchase Return by ID ───────────────────────────────────────────────

export async function getPurchaseReturnById(id: string) {
    try {
        const purchaseReturn = await prisma.purchaseReturn.findUnique({
            where: { id },
            include: {
                party: true,
                purchaseInvoice: { include: { items: true } },
                items: { include: { item: true } },
            },
        })
        return purchaseReturn
    } catch (error) {
        console.error("Error fetching purchase return:", error)
        throw new Error("Failed to fetch purchase return")
    }
}

// ─── Get invoices for Debit Note Selection (only active, non-cancelled) ──────

export async function getPurchaseInvoicesForReturn() {
    try {
        const userId = await requireUserId()
        const invoices = await prisma.purchaseInvoice.findMany({
            where: {
                userId,
                deletedAt: null,
                status: "active",
            },
            include: {
                party: { select: { id: true, name: true, state: true } },
                items: true,
                purchaseReturns: {
                    where: { deletedAt: null },
                    include: { items: true },
                },
            },
            orderBy: { invoiceDate: "desc" },
        })
        return invoices
    } catch (error) {
        console.error("Error fetching invoices for return:", error)
        throw new Error("Failed to fetch invoices")
    }
}

// ─── Create Purchase Return (Debit Note) ─────────────────────────────────────

export async function createPurchaseReturn(data: PurchaseReturnFormValues) {
    try {
        const userId = await requireUserId()
        const result = await prisma.$transaction(async (tx) => {
            const count = await tx.purchaseReturn.count({ where: { userId } })
            const debitNoteNumber = `DN-${String(count + 1).padStart(3, "0")}`

            const profile = await tx.businessProfile.findFirst({ where: { userId } })
            if (!profile) throw new Error("Business profile not found")

            // 2. Get original invoice
            const originalInvoice = await tx.purchaseInvoice.findUnique({
                where: { id: data.purchaseInvoiceId },
                include: { items: true, party: true },
            })
            if (!originalInvoice) throw new Error("Original invoice not found")
            if (originalInvoice.status === "cancelled") throw new Error("Cannot create return for cancelled invoice")

            const businessState = profile.state || ""
            // Reverse direction interstate calculation for purchase
            const interState = isInterState(businessState, originalInvoice.placeOfSupply || "")

            // 3. Calculate return totals
            let subtotal = 0
            let totalDiscount = 0
            let taxableAmount = 0
            let totalCgst = 0
            let totalSgst = 0
            let totalIgst = 0

            const returnItems = data.items.map((item) => {
                const gst = calculateLineItemGST(
                    item.unitPrice,
                    item.quantity,
                    item.discount,
                    item.discountType,
                    item.gstRate,
                    interState,
                    0
                )

                const baseAmount = item.unitPrice * item.quantity
                subtotal += baseAmount

                let discountAmt = 0
                if (item.discountType === "percent") {
                    discountAmt = (baseAmount * item.discount) / 100
                } else {
                    discountAmt = item.discount
                }
                totalDiscount += discountAmt
                taxableAmount += gst.taxableAmount
                totalCgst += gst.cgst
                totalSgst += gst.sgst
                totalIgst += gst.igst

                return {
                    itemId: item.itemId || null,
                    itemName: item.itemName,
                    hsnCode: item.hsnCode || null,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    discountType: item.discountType,
                    gstRate: item.gstRate,
                    cgst: gst.cgst,
                    sgst: gst.sgst,
                    igst: gst.igst,
                    amount: gst.totalAmount,
                }
            })

            const grandTotal = Math.round(taxableAmount + totalCgst + totalSgst + totalIgst)

            // 4. Create debit note
            const purchaseReturn = await tx.purchaseReturn.create({
                data: {
                    userId,
                    debitNoteNumber,
                    debitNoteDate: data.debitNoteDate,
                    purchaseInvoiceId: data.purchaseInvoiceId,
                    partyId: originalInvoice.partyId,
                    reason: data.reason || null,
                    subtotal: Math.round(subtotal * 100) / 100,
                    totalDiscount: Math.round(totalDiscount * 100) / 100,
                    taxableAmount: Math.round(taxableAmount * 100) / 100,
                    cgst: Math.round(totalCgst * 100) / 100,
                    sgst: Math.round(totalSgst * 100) / 100,
                    igst: Math.round(totalIgst * 100) / 100,
                    grandTotal,
                    items: {
                        create: returnItems,
                    },
                },
            })

            // 5. DECREASE stock for returned items
            // We bought it, stock increased. We return it, stock decreases (leaves our inventory).
            for (const item of data.items) {
                if (item.itemId) {
                    const inventoryItem = await tx.item.findUnique({ where: { id: item.itemId } })
                    if (inventoryItem) {
                        await tx.item.update({
                            where: { id: item.itemId },
                            data: { currentStock: Math.max(0, inventoryItem.currentStock - item.quantity) },
                        })
                        await tx.stockMovement.create({
                            data: {
                                itemId: item.itemId,
                                movementType: "out",
                                quantity: item.quantity,
                                reason: `Purchase Return ${debitNoteNumber}`,
                                referenceId: purchaseReturn.id,
                                referenceType: "purchase_return",
                            },
                        })
                    }
                }
            }

            return purchaseReturn
        })

        revalidatePath("/dashboard/purchases")
        revalidatePath("/dashboard/inventory")
        return { success: true, data: result }
    } catch (error: unknown) {
        console.error("Error creating purchase return:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to create debit note" }
    }
}
