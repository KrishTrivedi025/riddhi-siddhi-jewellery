"use server"

import { prisma } from "@/lib/db"
import { requireUserId } from "./auth-helper"

export interface LedgerEntry {
    id: string
    date: Date
    type: "opening" | "sale" | "purchase" | "payment_in" | "payment_out" | "sale_return" | "purchase_return"
    referenceNumber: string
    description: string
    debit: number
    credit: number
    runningBalance: number
}

export interface AgingBucket {
    label: string
    days: string
    amount: number
    invoiceCount: number
}

export interface PartyLedgerSummary {
    totalSales: number
    totalPurchases: number
    totalPaymentsIn: number
    totalPaymentsOut: number
    outstandingBalance: number
    balanceType: "debit" | "credit" // debit = party owes us, credit = we owe party
    lastTransactionDate: Date | null
    aging: AgingBucket[]
}

export type LedgerScope = "sales" | "purchase"

export interface LedgerOptions {
    /** Only used when scope === "sales". Omit to include both GST and non-GST sales. */
    isGst?: boolean
    /** Whether the party's stored opening balance counts toward this scope's running balance. */
    applyOpeningBalance: boolean
    fromDate?: Date
    toDate?: Date
}

const EMPTY_AGING = (): AgingBucket[] => [
    { label: "Current", days: "0-30 days", amount: 0, invoiceCount: 0 },
    { label: "1-2 Months", days: "31-60 days", amount: 0, invoiceCount: 0 },
    { label: "2-3 Months", days: "61-90 days", amount: 0, invoiceCount: 0 },
    { label: "3+ Months", days: "90+ days", amount: 0, invoiceCount: 0 },
]

export async function getPartyById(id: string) {
    try {
        const userId = await requireUserId()
        const party = await prisma.party.findFirst({
            where: { id, userId, deletedAt: null },
        })
        return party
    } catch (error) {
        console.error("Error fetching party:", error)
        throw new Error("Failed to fetch party")
    }
}

export async function getPartyLedger(
    partyId: string,
    scope: LedgerScope,
    options: LedgerOptions
): Promise<LedgerEntry[]> {
    try {
        const { isGst, applyOpeningBalance, fromDate, toDate } = options
        const party = await prisma.party.findFirst({
            where: { id: partyId, deletedAt: null },
        })
        if (!party) throw new Error("Party not found")

        const dateFilter = {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lte: new Date(toDate.setHours(23, 59, 59, 999)) }),
        }
        const hasDateFilter = !!(fromDate || toDate)

        type RawEntry = {
            date: Date
            type: LedgerEntry["type"]
            referenceNumber: string
            description: string
            debit: number
            credit: number
            id: string
        }
        const rawEntries: RawEntry[] = []

        if (scope === "sales") {
            const sales = await prisma.saleInvoice.findMany({
                where: {
                    partyId, deletedAt: null, status: "active",
                    ...(isGst !== undefined && { isGst }),
                    ...(hasDateFilter && { invoiceDate: dateFilter }),
                },
                orderBy: { invoiceDate: "asc" },
            })

            const payments = await prisma.payment.findMany({
                where: {
                    partyId, deletedAt: null, paymentType: "IN",
                    saleInvoiceId: { not: null },
                    ...(isGst !== undefined && { saleInvoice: { isGst } }),
                    ...(hasDateFilter && { paymentDate: dateFilter }),
                },
                orderBy: { paymentDate: "asc" },
            })
            // Payment.totalAmount already increments SaleInvoice.amountPaid when recorded
            // (see createPaymentIn) — sum per invoice so the upfront amount paid at invoice
            // creation (which has no Payment row) can be isolated without double-counting.
            const paidViaPaymentByInvoice = new Map<string, number>()
            for (const pm of payments) {
                if (!pm.saleInvoiceId) continue
                paidViaPaymentByInvoice.set(pm.saleInvoiceId, (paidViaPaymentByInvoice.get(pm.saleInvoiceId) || 0) + pm.totalAmount)
            }

            for (const s of sales) {
                rawEntries.push({
                    id: s.id,
                    date: s.invoiceDate,
                    type: "sale",
                    referenceNumber: s.invoiceNumber,
                    description: `Sale Invoice – ${s.paymentStatus === "paid" ? "Paid" : s.paymentStatus === "partial" ? "Partial" : "Unpaid"}`,
                    debit: s.grandTotal,
                    credit: 0,
                })
                const upfrontPaid = s.amountPaid - (paidViaPaymentByInvoice.get(s.id) || 0)
                if (upfrontPaid > 0.01) {
                    rawEntries.push({
                        id: `${s.id}-paid`,
                        date: s.invoiceDate,
                        type: "payment_in",
                        referenceNumber: s.invoiceNumber,
                        description: `Payment received against ${s.invoiceNumber}`,
                        debit: 0,
                        credit: upfrontPaid,
                    })
                }
            }

            for (const pm of payments) {
                rawEntries.push({
                    id: pm.id,
                    date: pm.paymentDate,
                    type: "payment_in",
                    referenceNumber: `PMT-${pm.id.slice(-6).toUpperCase()}`,
                    description: "Payment Received",
                    debit: 0,
                    credit: pm.totalAmount,
                })
            }

            const returns = await prisma.saleReturn.findMany({
                where: {
                    partyId, deletedAt: null, status: "active",
                    ...(isGst !== undefined && { saleInvoice: { isGst } }),
                    ...(hasDateFilter && { creditNoteDate: dateFilter }),
                },
                orderBy: { creditNoteDate: "asc" },
            })
            for (const r of returns) {
                rawEntries.push({
                    id: r.id,
                    date: r.creditNoteDate,
                    type: "sale_return",
                    referenceNumber: r.creditNoteNumber,
                    description: "Sale Return",
                    debit: 0,
                    credit: r.grandTotal,
                })
            }
        } else {
            const purchases = await prisma.purchaseInvoice.findMany({
                where: {
                    partyId, deletedAt: null, status: "active",
                    ...(hasDateFilter && { invoiceDate: dateFilter }),
                },
                orderBy: { invoiceDate: "asc" },
            })

            const payments = await prisma.payment.findMany({
                where: {
                    partyId, deletedAt: null, paymentType: "OUT",
                    ...(hasDateFilter && { paymentDate: dateFilter }),
                },
                orderBy: { paymentDate: "asc" },
            })
            // Same reconciliation as the sales side: createPurchaseInvoice/
            // markPurchaseInvoiceAsPaid create a matching Payment row for money paid,
            // so sum per invoice and only surface the (usually zero) unmatched residual.
            const paidViaPaymentByInvoice = new Map<string, number>()
            for (const pm of payments) {
                if (!pm.purchaseInvoiceId) continue
                paidViaPaymentByInvoice.set(pm.purchaseInvoiceId, (paidViaPaymentByInvoice.get(pm.purchaseInvoiceId) || 0) + pm.totalAmount)
            }

            for (const p of purchases) {
                rawEntries.push({
                    id: p.id,
                    date: p.invoiceDate,
                    type: "purchase",
                    referenceNumber: p.invoiceNumber,
                    description: `Purchase Invoice${p.vendorInvoiceNumber ? ` – Vendor Ref: ${p.vendorInvoiceNumber}` : ""}`,
                    debit: 0,
                    credit: p.grandTotal,
                })
                const unmatchedPaid = p.amountPaid - (paidViaPaymentByInvoice.get(p.id) || 0)
                if (unmatchedPaid > 0.01) {
                    rawEntries.push({
                        id: `${p.id}-paid`,
                        date: p.invoiceDate,
                        type: "payment_out",
                        referenceNumber: p.invoiceNumber,
                        description: `Payment made against ${p.invoiceNumber}`,
                        debit: unmatchedPaid,
                        credit: 0,
                    })
                }
            }

            for (const pm of payments) {
                rawEntries.push({
                    id: pm.id,
                    date: pm.paymentDate,
                    type: "payment_out",
                    referenceNumber: `PMT-${pm.id.slice(-6).toUpperCase()}`,
                    description: "Payment Made",
                    debit: pm.totalAmount,
                    credit: 0,
                })
            }

            const returns = await prisma.purchaseReturn.findMany({
                where: {
                    partyId, deletedAt: null, status: "active",
                    ...(hasDateFilter && { debitNoteDate: dateFilter }),
                },
                orderBy: { debitNoteDate: "asc" },
            })
            for (const r of returns) {
                rawEntries.push({
                    id: r.id,
                    date: r.debitNoteDate,
                    type: "purchase_return",
                    referenceNumber: r.debitNoteNumber,
                    description: "Purchase Return",
                    debit: r.grandTotal,
                    credit: 0,
                })
            }
        }

        // Sort chronologically
        rawEntries.sort((a, b) => a.date.getTime() - b.date.getTime())

        // Compute running balance starting from opening balance
        // For customers: opening debit = they owe us, opening credit = we owe them
        const openingDebit =
            applyOpeningBalance && party.balanceType === "debit" ? party.openingBalance : 0
        const openingCredit =
            applyOpeningBalance && party.balanceType === "credit" ? party.openingBalance : 0

        const ledger: LedgerEntry[] = []
        let runningBalance = openingDebit - openingCredit // positive = party owes us

        // Add opening balance entry only if no date filter (or if from start)
        if (!hasDateFilter) {
            ledger.push({
                id: "opening",
                date: party.createdAt,
                type: "opening",
                referenceNumber: "—",
                description: "Opening Balance",
                debit: openingDebit,
                credit: openingCredit,
                runningBalance,
            })
        }

        for (const entry of rawEntries) {
            // Debit = party owes us more / Credit = reduces what party owes us
            runningBalance += entry.debit - entry.credit
            ledger.push({
                ...entry,
                runningBalance,
            })
        }

        return ledger
    } catch (error) {
        console.error("Error fetching party ledger:", error)
        throw new Error("Failed to fetch party ledger")
    }
}

export async function getPartyLedgerSummary(
    partyId: string,
    scope: LedgerScope,
    options: Pick<LedgerOptions, "isGst" | "applyOpeningBalance">
): Promise<PartyLedgerSummary> {
    try {
        const { isGst, applyOpeningBalance } = options
        const party = await prisma.party.findFirst({
            where: { id: partyId, deletedAt: null },
        })
        if (!party) throw new Error("Party not found")

        const openingBalance = applyOpeningBalance
            ? (party.balanceType === "debit" ? party.openingBalance : -party.openingBalance)
            : 0

        if (scope === "sales") {
            const sales = await prisma.saleInvoice.findMany({
                where: {
                    partyId, deletedAt: null, status: "active",
                    ...(isGst !== undefined && { isGst }),
                },
                orderBy: { invoiceDate: "desc" },
            })
            const payments = await prisma.payment.findMany({
                where: {
                    partyId, deletedAt: null, paymentType: "IN",
                    saleInvoiceId: { not: null },
                    ...(isGst !== undefined && { saleInvoice: { isGst } }),
                },
                orderBy: { paymentDate: "desc" },
            })
            const returns = await prisma.saleReturn.findMany({
                where: {
                    partyId, deletedAt: null, status: "active",
                    ...(isGst !== undefined && { saleInvoice: { isGst } }),
                },
                orderBy: { creditNoteDate: "desc" },
            })

            const totalSales = sales.reduce((s, i) => s + i.grandTotal, 0)
            // invoice.amountPaid already includes every Payment recorded against it
            // (createPaymentIn keeps them in sync), so this alone is the true total —
            // adding the Payment rows' own sum on top would double-count them.
            const totalPaymentsIn = sales.reduce((s, i) => s + i.amountPaid, 0)
            const totalReturns = returns.reduce((s, r) => s + r.grandTotal, 0)

            const net = openingBalance + totalSales - totalPaymentsIn - totalReturns

            // Aging: based on unpaid sales invoices (overdue)
            const now = new Date()
            const ageBuckets = EMPTY_AGING()
            const unpaidSales = sales.filter((s) => s.paymentStatus !== "paid")
            for (const s of unpaidSales) {
                const dueDate = s.dueDate || s.invoiceDate
                const diffDays = Math.floor(
                    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
                )
                const outstanding = s.balanceDue
                if (diffDays <= 30) { ageBuckets[0].amount += outstanding; ageBuckets[0].invoiceCount++ }
                else if (diffDays <= 60) { ageBuckets[1].amount += outstanding; ageBuckets[1].invoiceCount++ }
                else if (diffDays <= 90) { ageBuckets[2].amount += outstanding; ageBuckets[2].invoiceCount++ }
                else { ageBuckets[3].amount += outstanding; ageBuckets[3].invoiceCount++ }
            }

            const allDates = [
                ...sales.map((s) => s.invoiceDate),
                ...payments.map((p) => p.paymentDate),
                ...returns.map((r) => r.creditNoteDate),
            ].sort((a, b) => b.getTime() - a.getTime())

            return {
                totalSales,
                totalPurchases: 0,
                totalPaymentsIn,
                totalPaymentsOut: 0,
                outstandingBalance: Math.abs(net),
                balanceType: net >= 0 ? "debit" : "credit",
                lastTransactionDate: allDates[0] || null,
                aging: ageBuckets,
            }
        }

        // scope === "purchase"
        const purchases = await prisma.purchaseInvoice.findMany({
            where: { partyId, deletedAt: null, status: "active" },
            orderBy: { invoiceDate: "desc" },
        })
        const payments = await prisma.payment.findMany({
            where: { partyId, deletedAt: null, paymentType: "OUT" },
            orderBy: { paymentDate: "desc" },
        })
        const returns = await prisma.purchaseReturn.findMany({
            where: { partyId, deletedAt: null, status: "active" },
            orderBy: { debitNoteDate: "desc" },
        })

        const totalPurchases = purchases.reduce((s, p) => s + p.grandTotal, 0)
        // Same reasoning as the sales side — purchaseInvoice.amountPaid already
        // includes every linked Payment, so don't sum the Payment rows on top.
        const totalPaymentsOut = purchases.reduce((s, p) => s + p.amountPaid, 0)
        const totalReturns = returns.reduce((s, r) => s + r.grandTotal, 0)

        const net = openingBalance - totalPurchases + totalPaymentsOut + totalReturns

        const allDates = [
            ...purchases.map((p) => p.invoiceDate),
            ...payments.map((p) => p.paymentDate),
            ...returns.map((r) => r.debitNoteDate),
        ].sort((a, b) => b.getTime() - a.getTime())

        return {
            totalSales: 0,
            totalPurchases,
            totalPaymentsIn: 0,
            totalPaymentsOut,
            outstandingBalance: Math.abs(net),
            balanceType: net >= 0 ? "debit" : "credit",
            lastTransactionDate: allDates[0] || null,
            aging: EMPTY_AGING(),
        }
    } catch (error) {
        console.error("Error fetching party summary:", error)
        throw new Error("Failed to fetch party summary")
    }
}
