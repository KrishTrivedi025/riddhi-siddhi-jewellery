"use server"

import { prisma } from "@/lib/db"
import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { SaleInvoiceFormValues } from "../schemas/sale-invoice-schema"
import { SaleReturnFormValues } from "../schemas/sale-return-schema"
import { calculateLineItemGST } from "../gst-utils"
import { isInterState } from "../indian-states"
import { requireUserId } from "./auth-helper"

// ─── Business Profile ────────────────────────────────────────────────────────

export async function getBusinessProfile() {
    try {
        const userId = await requireUserId()
        const profile = await prisma.businessProfile.findFirst({ where: { userId } })
        if (!profile) return null

        // Map the fields stored directly on the profile to the defaultBank structure
        // that components expect.
        const defaultBank = {
            bankName: profile.bankName,
            accountName: profile.accountName,
            accountNumber: profile.accountNumber,
            ifscCode: profile.ifscCode,
            branchName: profile.branchName,
        }

        return { ...profile, defaultBank }
    } catch (error) {
        console.error("Error fetching business profile:", error)
        return null
    }
}

// ─── Invoice Number Generation ───────────────────────────────────────────────

export async function getNextInvoiceNumber(isGst: boolean = true): Promise<string> {
    const userId = await requireUserId()
    const profile = await prisma.businessProfile.findFirst({ where: { userId } })
    if (isGst) {
        const prefix = profile?.invoicePrefix || "INV"
        const counter = profile?.invoiceCounter || 1
        return `${prefix}-${String(counter).padStart(3, "0")}`
    } else {
        const p = profile as unknown as { noGstInvoicePrefix?: string; noGstInvoiceCounter?: number }
        const prefix = p?.noGstInvoicePrefix || "BILL"
        const counter = p?.noGstInvoiceCounter || 1
        return `${prefix}-${String(counter).padStart(3, "0")}`
    }
}

export async function getNextCreditNoteNumber(): Promise<string> {
    const userId = await requireUserId()
    const profile = await prisma.businessProfile.findFirst({ where: { userId } })
    const p = profile as unknown as { creditNotePrefix?: string; creditNoteCounter?: number }
    const prefix = p?.creditNotePrefix || "CN"
    const counter = p?.creditNoteCounter || 1
    return `${prefix}-${String(counter).padStart(3, "0")}`
}

// ─── Sale Invoices — List ────────────────────────────────────────────────────

export async function getSaleInvoices(filters?: {
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
                { party: { name: { contains: filters.search, mode: "insensitive" } } },
            ]
        }

        if (filters?.dateFrom || filters?.dateTo) {
            where.invoiceDate = {} as Record<string, Date>
            if (filters?.dateFrom) (where.invoiceDate as Record<string, Date>).gte = filters.dateFrom
            if (filters?.dateTo) (where.invoiceDate as Record<string, Date>).lte = filters.dateTo
        }

        const invoices = await prisma.saleInvoice.findMany({
            where,
            include: {
                party: { select: { id: true, name: true, state: true, gstin: true } },
                items: true,
                _count: { select: { saleReturns: true } as never },
            },
            orderBy: { createdAt: "desc" },
        })

        return invoices
    } catch (error) {
        console.error("Error fetching sale invoices:", error)
        throw new Error("Failed to fetch sale invoices")
    }
}

// ─── Sale Invoice — Get by ID ────────────────────────────────────────────────

export async function getSaleInvoiceById(id: string) {
    noStore()
    try {
        const userId = await requireUserId()
        const invoice = await prisma.saleInvoice.findUnique({
            where: { id },
            include: {
                party: true,
                items: {
                    include: { item: { select: { name: true, currentStock: true } } },
                },
                payments: {
                    include: { paymentModes: true },
                },
                saleReturns: {
                    where: { deletedAt: null },
                    include: { items: true },
                } as never,
            },
        })
        if (invoice && invoice.userId !== userId) return null;
        return invoice
    } catch (error) {
        console.error("Error fetching sale invoice:", error)
        throw new Error("Failed to fetch sale invoice")
    }
}

// ─── Create Sale Invoice ─────────────────────────────────────────────────────

export async function createSaleInvoice(data: SaleInvoiceFormValues & { isGst?: boolean }) {
    try {
        const userId = await requireUserId()
        const isGst = data.isGst !== false // default true
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get business profile for state + invoice number
            const profile = await tx.businessProfile.findFirst({ where: { userId } })
            if (!profile) throw new Error("Business profile not found. Please set up your business profile first.")

            const businessState = profile.state || ""
            const party = await tx.party.findFirst({ where: { id: data.partyId, userId } })
            if (!party) throw new Error("Customer not found")

            const interState = isInterState(businessState, data.placeOfSupply)

            // 2. Generate invoice number based on GST type
            const profileExt = profile as unknown as { noGstInvoicePrefix?: string; noGstInvoiceCounter?: number }
            const invoiceNumber = isGst
                ? `${profile.invoicePrefix}-${String(profile.invoiceCounter).padStart(3, "0")}`
                : `${profileExt.noGstInvoicePrefix || "BILL"}-${String(profileExt.noGstInvoiceCounter || 1).padStart(3, "0")}`

            // 3. Calculate totals for each line item
            let subtotal = 0
            let totalDiscount = 0
            let taxableAmount = 0
            let totalCgst = 0
            let totalSgst = 0
            let totalIgst = 0

            const invoiceItems = data.items.map((item) => {
                const effectiveGstRate = isGst ? item.gstRate : 0
                const gst = calculateLineItemGST(
                    item.unitPrice,
                    item.quantity,
                    item.discount,
                    item.discountType,
                    effectiveGstRate,
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
                    gstRate: effectiveGstRate,
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
            const invoice = await tx.saleInvoice.create({
                data: {
                    userId,
                    invoiceNumber,
                    invoiceDate: data.invoiceDate,
                    dueDate: data.dueDate || null,
                    partyId: data.partyId,
                    placeOfSupply: data.placeOfSupply,
                    shipToAddress: data.shipToAddress || null,
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
                    termsConditions: data.termsConditions || null,
                    status: "active",
                    isGst,
                    items: {
                        create: invoiceItems,
                    },
                },
                include: { items: true, party: true },
            })

            // 5. Deduct stock for each item that references an inventory item
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
                                reason: `Sale Invoice ${invoiceNumber}`,
                                referenceId: invoice.id,
                                referenceType: "sale",
                            },
                        })
                    }
                }
            }

            // 6. Increment invoice counter
            await tx.businessProfile.update({
                where: { id: profile.id },
                data: isGst
                    ? { invoiceCounter: profile.invoiceCounter + 1 }
                    : { noGstInvoiceCounter: (profileExt.noGstInvoiceCounter || 1) + 1 },
            })

            return invoice
        })

        revalidatePath("/dashboard/sales")
        revalidatePath("/dashboard/inventory")
        revalidatePath("/dashboard")
        return { success: true, data: result }
    } catch (error: unknown) {
        console.error("Error creating sale invoice:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to create sale invoice" }
    }
}

// ─── Update Sale Invoice (Draft only) ────────────────────────────────────────

export async function updateSaleInvoiceStatus(
    id: string,
    status: string
) {
    try {
        const invoice = await prisma.saleInvoice.update({
            where: { id },
            data: { status },
        })
        revalidatePath("/dashboard/sales")
        return { success: true, data: invoice }
    } catch (error: unknown) {
        console.error("Error updating invoice status:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to update invoice" }
    }
}

// ─── Mark Invoice as Paid ────────────────────────────────────────────────────

export async function markInvoiceAsPaid(id: string) {
    try {
        const invoice = await prisma.saleInvoice.findUnique({ where: { id } })
        if (!invoice) return { success: false, error: "Invoice not found" }

        await prisma.saleInvoice.update({
            where: { id },
            data: {
                amountPaid: invoice.grandTotal,
                balanceDue: 0,
                paymentStatus: "paid",
            },
        })

        revalidatePath("/dashboard/sales")
        revalidatePath(`/dashboard/sales/${id}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("Error marking invoice as paid:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to mark as paid" }
    }
}

// ─── Void / Cancel Invoice ───────────────────────────────────────────────────

export async function voidInvoice(id: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.saleInvoice.findUnique({
                where: { id },
                include: { items: true },
            })
            if (!invoice) throw new Error("Invoice not found")
            if (invoice.status === "cancelled") throw new Error("Invoice is already cancelled")

            // Reverse stock for each item
            for (const item of invoice.items) {
                if (item.itemId) {
                    const inventoryItem = await tx.item.findUnique({ where: { id: item.itemId } })
                    if (inventoryItem) {
                        await tx.item.update({
                            where: { id: item.itemId },
                            data: { currentStock: inventoryItem.currentStock + item.quantity },
                        })
                        await tx.stockMovement.create({
                            data: {
                                itemId: item.itemId,
                                movementType: "in",
                                quantity: item.quantity,
                                reason: `Void Invoice ${invoice.invoiceNumber}`,
                                referenceId: invoice.id,
                                referenceType: "sale_reversal",
                            },
                        })
                    }
                }
            }

            // Mark invoice as cancelled
            const updatedInvoice = await tx.saleInvoice.update({
                where: { id },
                data: { status: "cancelled" },
            })

            return updatedInvoice
        })

        revalidatePath("/dashboard/sales")
        revalidatePath("/dashboard/inventory")
        return { success: true, data: result }
    } catch (error: unknown) {
        console.error("Error voiding invoice:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to void invoice" }
    }
}

// ─── Delete Sale Invoice (soft) ──────────────────────────────────────────────

export async function deleteSaleInvoice(id: string) {
    try {
        await prisma.saleInvoice.update({
            where: { id },
            data: { deletedAt: new Date() },
        })
        revalidatePath("/dashboard/sales")
        return { success: true }
    } catch (error) {
        console.error("Error deleting sale invoice:", error)
        return { success: false, error: "Failed to delete sale invoice" }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// SALE RETURNS (CREDIT NOTES)
// ═════════════════════════════════════════════════════════════════════════════

// ─── List Sale Returns ───────────────────────────────────────────────────────

export async function getSaleReturns() {
    try {
        const userId = await requireUserId()
        const returns = await prisma.saleReturn.findMany({
            where: { userId, deletedAt: null },
            include: {
                party: { select: { id: true, name: true } },
                saleInvoice: { select: { id: true, invoiceNumber: true } },
                items: true,
            },
            orderBy: { createdAt: "desc" },
        })
        return returns
    } catch (error) {
        console.error("Error fetching sale returns:", error)
        throw new Error("Failed to fetch sale returns")
    }
}

// ─── Get Sale Return by ID ───────────────────────────────────────────────────

export async function getSaleReturnById(id: string) {
    try {
        const saleReturn = await prisma.saleReturn.findUnique({
            where: { id },
            include: {
                party: true,
                saleInvoice: { include: { items: true } },
                items: { include: { item: true } },
            },
        })
        return saleReturn
    } catch (error) {
        console.error("Error fetching sale return:", error)
        throw new Error("Failed to fetch sale return")
    }
}

// ─── Get invoices for Credit Note Selection (only active, non-cancelled) ─────

export async function getInvoicesForReturn() {
    try {
        const userId = await requireUserId()
        const invoices = await prisma.saleInvoice.findMany({
            where: {
                userId,
                deletedAt: null,
                status: "active",
            },
            include: {
                party: { select: { id: true, name: true, state: true } },
                items: true,
                saleReturns: {
                    where: { deletedAt: null },
                    include: { items: true },
                } as never,
            },
            orderBy: { invoiceDate: "desc" },
        })
        return invoices
    } catch (error) {
        console.error("Error fetching invoices for return:", error)
        throw new Error("Failed to fetch invoices")
    }
}

// ─── Create Sale Return (Credit Note) ────────────────────────────────────────

export async function createSaleReturn(data: SaleReturnFormValues) {
    try {
        const userId = await requireUserId()
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get business profile for credit note number
            const profile = await tx.businessProfile.findFirst({ where: { userId } })
            if (!profile) throw new Error("Business profile not found")

            // 2. Get original invoice
            const originalInvoice = await tx.saleInvoice.findUnique({
                where: { id: data.saleInvoiceId },
                include: { items: true, party: true },
            })
            if (!originalInvoice) throw new Error("Original invoice not found")
            if (originalInvoice.status === "cancelled") throw new Error("Cannot create return for cancelled invoice")

            const businessState = profile.state || ""
            const interState = isInterState(businessState, originalInvoice.placeOfSupply || "")

            // 3. Generate credit note number
            const p = profile as unknown as { creditNotePrefix: string; creditNoteCounter: number; id: string; }
            const creditNoteNumber = `${p.creditNotePrefix}-${String(p.creditNoteCounter).padStart(3, "0")}`

            // 4. Calculate return totals
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

            // 5. Create credit note
            const saleReturn = await tx.saleReturn.create({
                data: {
                    userId,
                    creditNoteNumber,
                    creditNoteDate: data.creditNoteDate,
                    saleInvoiceId: data.saleInvoiceId,
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

            // 6. Increase stock for returned items
            for (const item of data.items) {
                if (item.itemId) {
                    const inventoryItem = await tx.item.findUnique({ where: { id: item.itemId } })
                    if (inventoryItem) {
                        await tx.item.update({
                            where: { id: item.itemId },
                            data: { currentStock: inventoryItem.currentStock + item.quantity },
                        })
                        await tx.stockMovement.create({
                            data: {
                                itemId: item.itemId,
                                movementType: "in",
                                quantity: item.quantity,
                                reason: `Sale Return ${creditNoteNumber}`,
                                referenceId: saleReturn.id,
                                referenceType: "sale_return",
                            },
                        })
                    }
                }
            }

            // 7. Increment credit note counter
            const pUpdate = profile as unknown as { creditNoteCounter: number; id: string; }
            await tx.businessProfile.update({
                where: { id: pUpdate.id },
                data: { creditNoteCounter: pUpdate.creditNoteCounter + 1 } as never,
            })

            return saleReturn
        })

        revalidatePath("/dashboard/sales")
        revalidatePath("/dashboard/inventory")
        return { success: true, data: result }
    } catch (error: unknown) {
        console.error("Error creating sale return:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to create sale return" }
    }
}
