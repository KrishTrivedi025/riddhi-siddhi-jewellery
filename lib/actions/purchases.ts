"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { PurchaseInvoiceFormValues } from "../schemas/purchase-schema"
import { calculateLineItemGST } from "../gst-utils"
import { isInterState } from "../indian-states"
import { requireUserId } from "./auth-helper"

// ─── Number Generation ───────────────────────────────────────────────────────

export async function getNextPurchaseInvoiceNumber(): Promise<string> {
    const count = await prisma.purchaseInvoice.count()
    return `PUR-${String(count + 1).padStart(3, "0")}`
}

// ─── Purchases — List ────────────────────────────────────────────────────────

export async function getPurchaseInvoices(filters?: {
    status?: string
    paymentStatus?: string
    search?: string
    dateFrom?: Date
    dateTo?: Date
}) {
    try {
        const userId = await requireUserId()
        const where: Record<string, unknown> = {
            userId,
            deletedAt: null,
            ...(filters?.status && filters.status !== "all" && { status: filters.status }),
            ...(filters?.paymentStatus && filters.paymentStatus !== "all" && { paymentStatus: filters.paymentStatus }),
        }

        if (filters?.search) {
            where.OR = [
                { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
                { vendorInvoiceNumber: { contains: filters.search, mode: "insensitive" } },
                { party: { name: { contains: filters.search, mode: "insensitive" } } },
            ]
        }

        if (filters?.dateFrom || filters?.dateTo) {
            where.invoiceDate = {} as Record<string, Date>
            if (filters?.dateFrom) (where.invoiceDate as Record<string, Date>).gte = filters.dateFrom
            if (filters?.dateTo) (where.invoiceDate as Record<string, Date>).lte = filters.dateTo
        }

        const invoices = await prisma.purchaseInvoice.findMany({
            where,
            include: {
                party: { select: { id: true, name: true, state: true, gstin: true } },
                items: true,
            },
            orderBy: { invoiceDate: "desc" },
        })

        return invoices
    } catch (error) {
        console.error("Error fetching purchase invoices:", error)
        throw new Error("Failed to fetch purchase invoices")
    }
}

// ─── Purchase — Get by ID ────────────────────────────────────────────────────

export async function getPurchaseInvoiceById(id: string) {
    try {
        const userId = await requireUserId()
        const invoice = await prisma.purchaseInvoice.findFirst({
            where: { id, userId },
            include: {
                party: true,
                items: {
                    include: { item: { select: { name: true, currentStock: true } } },
                },
                payments: {
                    include: { paymentModes: true },
                },
            },
        })
        return invoice
    } catch (error) {
        console.error("Error fetching purchase invoice:", error)
        throw new Error("Failed to fetch purchase invoice")
    }
}

// ─── Create Purchase Invoice ─────────────────────────────────────────────────

export async function createPurchaseInvoice(data: PurchaseInvoiceFormValues) {
    try {
        const userId = await requireUserId()
        const result = await prisma.$transaction(async (tx) => {
            // 1. Generate internal invoice number
            const count = await tx.purchaseInvoice.count({ where: { userId } })
            const invoiceNumber = `PUR-${String(count + 1).padStart(3, "0")}`

            // 2. Get party state for IGST calculation
            const party = await tx.party.findFirst({ where: { id: data.partyId, userId } })
            if (!party) throw new Error("Supplier not found")

            const profile = await tx.businessProfile.findFirst({ where: { userId } })
            const businessState = profile?.state || ""
            const interState = isInterState(businessState, data.placeOfSupply)

            // 3. Calculate totals for each line item
            let subtotal = 0
            let totalDiscount = 0
            let taxableAmount = 0
            let totalCgst = 0
            let totalSgst = 0
            let totalIgst = 0

            const invoiceItems = data.items.map((item) => {
                const gst = calculateLineItemGST(
                    item.unitPrice,
                    item.quantity,
                    item.discount,
                    item.discountType,
                    item.gstRate,
                    interState,
                    item.makingCharges || 0
                )

                const baseAmount = item.unitPrice * item.quantity + (item.makingCharges || 0)
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
                    description: item.description || null,
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
                    purity: item.purity || null,
                    netWeight: item.netWeight || null,
                    grossWeight: item.grossWeight || null,
                    makingCharges: item.makingCharges || null,
                    wastagePercent: item.wastagePercent || null,
                    hallmarkNumber: item.hallmarkNumber || null,
                    stoneDetails: item.stoneDetails || null,
                }
            })

            const totalBeforeRound = taxableAmount + totalCgst + totalSgst + totalIgst
            const roundOff = Math.round(totalBeforeRound * 100) / 100
            const grandTotal = Math.round(totalBeforeRound)
            const actualRoundOff = grandTotal - roundOff

            const amountPaid = data.amountPaid || 0
            const balanceDue = grandTotal - amountPaid
            let paymentStatus = "unpaid"
            if (amountPaid >= grandTotal) paymentStatus = "paid"
            else if (amountPaid > 0) paymentStatus = "partial"

            // 4. Create the invoice
            const invoice = await tx.purchaseInvoice.create({
                data: {
                    userId,
                    invoiceNumber,
                    vendorInvoiceNumber: data.vendorInvoiceNumber || null,
                    invoiceDate: data.invoiceDate,
                    dueDate: data.dueDate || null,
                    partyId: data.partyId,
                    placeOfSupply: data.placeOfSupply,
                    subtotal: Math.round(subtotal * 100) / 100,
                    totalDiscount: Math.round(totalDiscount * 100) / 100,
                    taxableAmount: Math.round(taxableAmount * 100) / 100,
                    cgst: Math.round(totalCgst * 100) / 100,
                    sgst: Math.round(totalSgst * 100) / 100,
                    igst: Math.round(totalIgst * 100) / 100,
                    roundOff: Math.round(actualRoundOff * 100) / 100,
                    grandTotal,
                    amountPaid,
                    balanceDue,
                    paymentStatus,
                    notes: data.notes || null,
                    status: "active",
                    items: {
                        create: invoiceItems,
                    },
                },
                include: { items: true, party: true },
            })

            // 5. Add stock for each item that references an inventory item
            for (const item of data.items) {
                if (item.itemId) {
                    const inventoryItem = await tx.item.findUnique({ where: { id: item.itemId } })
                    if (inventoryItem) {
                        // Increase stock for purchases (double-entry tracking)
                        await tx.item.update({
                            where: { id: item.itemId },
                            data: { currentStock: inventoryItem.currentStock + item.quantity },
                        })
                        await tx.stockMovement.create({
                            data: {
                                itemId: item.itemId,
                                movementType: "in",
                                quantity: item.quantity,
                                reason: `Purchase Invoice ${invoiceNumber}`,
                                referenceId: invoice.id,
                                referenceType: "purchase",
                            },
                        })
                    }
                }
            }

            // 6. Record payment if any is made simultaneously
            if (amountPaid > 0 && data.paymentMode !== "none") {
                const payment = await tx.payment.create({
                    data: {
                        userId,
                        paymentType: "OUT", // Money goes out to supplier
                        partyId: data.partyId,
                        purchaseInvoiceId: invoice.id,
                        paymentDate: data.invoiceDate,
                        totalAmount: amountPaid,
                        notes: `Initial payment for Purchase ${invoiceNumber}`
                    }
                })
                await tx.paymentMode.create({
                    data: {
                        paymentId: payment.id,
                        mode: data.paymentMode,
                        amount: amountPaid
                    }
                })
            }

            return invoice
        })

        revalidatePath("/dashboard/purchases")
        revalidatePath("/dashboard/inventory")
        revalidatePath("/dashboard")
        return { success: true, data: result }
    } catch (error: unknown) {
        console.error("Error creating purchase invoice:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to create purchase invoice" }
    }
}

// ─── Mark Invoice as Paid ────────────────────────────────────────────────────

export async function markPurchaseInvoiceAsPaid(id: string) {
    try {
        const userId = await requireUserId()
        const invoice = await prisma.purchaseInvoice.findFirst({ where: { id, userId } })
        if (!invoice) return { success: false, error: "Invoice not found" }

        await prisma.$transaction(async (tx) => {
            const amountToPay = invoice.balanceDue

            // Create Payment OUT
            const payment = await tx.payment.create({
                 data: {
                    userId,
                    paymentType: "OUT",
                    partyId: invoice.partyId,
                    purchaseInvoiceId: invoice.id,
                    paymentDate: new Date(),
                    totalAmount: amountToPay,
                    notes: `Full payment settlement for Purchase ${invoice.invoiceNumber}`
                 }
            })
            await tx.paymentMode.create({
                 data: {
                     paymentId: payment.id,
                     mode: "cash", // Or auto bank depending on standard logic
                     amount: amountToPay
                 }
            })

            // Update Invoice
            await tx.purchaseInvoice.update({
                where: { id },
                data: {
                    amountPaid: invoice.grandTotal,
                    balanceDue: 0,
                    paymentStatus: "paid",
                },
            })
        })

        revalidatePath("/dashboard/purchases")
        revalidatePath(`/dashboard/purchases/${id}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Error marking purchase invoice as paid:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to mark as paid" }
    }
}

// ─── Void / Cancel Purchase Invoice ──────────────────────────────────────────

export async function voidPurchaseInvoice(id: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.purchaseInvoice.findUnique({
                where: { id },
                include: { items: true },
            })
            if (!invoice) throw new Error("Invoice not found")
            if (invoice.status === "cancelled") throw new Error("Invoice is already cancelled")

            // Reverse stock for each item (decrease stock)
            for (const item of invoice.items) {
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
                                reason: `Void Purchase Invoice ${invoice.invoiceNumber}`,
                                referenceId: invoice.id,
                                referenceType: "purchase_reversal",
                            },
                        })
                    }
                }
            }

            // Mark invoice as cancelled
            const updatedInvoice = await tx.purchaseInvoice.update({
                where: { id },
                data: { status: "cancelled" },
            })

            return updatedInvoice
        })

        revalidatePath("/dashboard/purchases")
        revalidatePath("/dashboard/inventory")
        return { success: true, data: result }
    } catch (error: unknown) {
        console.error("Error voiding purchase invoice:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to void invoice" }
    }
}
