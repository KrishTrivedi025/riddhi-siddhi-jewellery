"use server"

import { prisma } from "@/lib/db"
import { requireUserId } from "./auth-helper"

export interface LedgerEntry {
    id: string
    date: Date
    type: "opening" | "sale" | "purchase" | "payment_in" | "payment_out"
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
    fromDate?: Date,
    toDate?: Date
): Promise<LedgerEntry[]> {
    try {
        const party = await prisma.party.findFirst({
            where: { id: partyId, deletedAt: null },
        })
        if (!party) throw new Error("Party not found")

        // Build date filter
        const dateFilter = {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lte: new Date(toDate.setHours(23, 59, 59, 999)) }),
        }
        const hasDateFilter = fromDate || toDate

        // Fetch sales
        const sales = await prisma.saleInvoice.findMany({
            where: {
                partyId,
                deletedAt: null,
                status: "active",
                ...(hasDateFilter && { invoiceDate: dateFilter }),
            },
            orderBy: { invoiceDate: "asc" },
        })

        // Fetch purchases
        const purchases = await prisma.purchaseInvoice.findMany({
            where: {
                partyId,
                deletedAt: null,
                status: "active",
                ...(hasDateFilter && { invoiceDate: dateFilter }),
            },
            orderBy: { invoiceDate: "asc" },
        })

        // Fetch payments
        const payments = await prisma.payment.findMany({
            where: {
                partyId,
                deletedAt: null,
                ...(hasDateFilter && { paymentDate: dateFilter }),
            },
            orderBy: { paymentDate: "asc" },
        })

        // Build raw entries array
        const rawEntries: Array<{
            date: Date
            type: LedgerEntry["type"]
            referenceNumber: string
            description: string
            debit: number
            credit: number
            id: string
        }> = []

        for (const s of sales) {
            rawEntries.push({
                id: s.id,
                date: s.invoiceDate,
                type: "sale",
                referenceNumber: s.invoiceNumber,
                description: `Sale Invoice – ${s.paymentStatus === "paid" ? "Paid" : s.paymentStatus === "partial" ? "Partial" : "Unpaid"}`,
                debit: s.grandTotal, // party owes us
                credit: 0,
            })
            // If amount was partially/fully paid at invoice time, add credit
            if (s.amountPaid > 0) {
                rawEntries.push({
                    id: `${s.id}-paid`,
                    date: s.invoiceDate,
                    type: "payment_in",
                    referenceNumber: s.invoiceNumber,
                    description: `Payment received against ${s.invoiceNumber}`,
                    debit: 0,
                    credit: s.amountPaid,
                })
            }
        }

        for (const p of purchases) {
            rawEntries.push({
                id: p.id,
                date: p.invoiceDate,
                type: "purchase",
                referenceNumber: p.invoiceNumber,
                description: `Purchase Invoice${p.vendorInvoiceNumber ? ` – Vendor Ref: ${p.vendorInvoiceNumber}` : ""}`,
                debit: 0,
                credit: p.grandTotal, // we owe party
            })
            if (p.amountPaid > 0) {
                rawEntries.push({
                    id: `${p.id}-paid`,
                    date: p.invoiceDate,
                    type: "payment_out",
                    referenceNumber: p.invoiceNumber,
                    description: `Payment made against ${p.invoiceNumber}`,
                    debit: p.amountPaid,
                    credit: 0,
                })
            }
        }

        for (const pm of payments) {
            if (pm.paymentType === "in" || pm.paymentType === "received") {
                rawEntries.push({
                    id: pm.id,
                    date: pm.paymentDate,
                    type: "payment_in",
                    referenceNumber: `PMT-${pm.id.slice(-6).toUpperCase()}`,
                    description: `Payment Received`,
                    debit: 0,
                    credit: pm.totalAmount,
                })
            } else {
                rawEntries.push({
                    id: pm.id,
                    date: pm.paymentDate,
                    type: "payment_out",
                    referenceNumber: `PMT-${pm.id.slice(-6).toUpperCase()}`,
                    description: `Payment Made`,
                    debit: pm.totalAmount,
                    credit: 0,
                })
            }
        }

        // Sort chronologically
        rawEntries.sort((a, b) => a.date.getTime() - b.date.getTime())

        // Compute running balance starting from opening balance
        // For customers: opening debit = they owe us, opening credit = we owe them
        const openingDebit =
            party.balanceType === "debit" ? party.openingBalance : 0
        const openingCredit =
            party.balanceType === "credit" ? party.openingBalance : 0

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
    partyId: string
): Promise<PartyLedgerSummary> {
    try {
        const party = await prisma.party.findFirst({
            where: { id: partyId, deletedAt: null },
        })
        if (!party) throw new Error("Party not found")

        const sales = await prisma.saleInvoice.findMany({
            where: { partyId, deletedAt: null, status: "active" },
            orderBy: { invoiceDate: "desc" },
        })

        const purchases = await prisma.purchaseInvoice.findMany({
            where: { partyId, deletedAt: null, status: "active" },
            orderBy: { invoiceDate: "desc" },
        })

        const payments = await prisma.payment.findMany({
            where: { partyId, deletedAt: null },
            orderBy: { paymentDate: "desc" },
        })

        const totalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0)
        const totalPurchases = purchases.reduce(
            (sum, p) => sum + p.grandTotal,
            0
        )
        const totalPaymentsIn = payments
            .filter((p) => p.paymentType === "in" || p.paymentType === "received")
            .reduce((sum, p) => sum + p.totalAmount, 0)
        const totalPaymentsOut = payments
            .filter((p) => p.paymentType === "out" || p.paymentType === "made")
            .reduce((sum, p) => sum + p.totalAmount, 0)

        // Opening balance
        const openingBalance =
            party.balanceType === "debit"
                ? party.openingBalance
                : -party.openingBalance

        // Net outstanding: positive = party owes us (receivable), negative = we owe party (payable)
        const net =
            openingBalance +
            totalSales -
            totalPurchases -
            totalPaymentsIn +
            totalPaymentsOut

        // Compute also from invoice-level paid amounts
        const salesPaid = sales.reduce((sum, s) => sum + s.amountPaid, 0)
        const purchasesPaid = purchases.reduce((sum, p) => sum + p.amountPaid, 0)

        // Aging: based on unpaid sales invoices (overdue)
        const now = new Date()

        const ageBuckets: AgingBucket[] = [
            { label: "Current", days: "0-30 days", amount: 0, invoiceCount: 0 },
            { label: "1-2 Months", days: "31-60 days", amount: 0, invoiceCount: 0 },
            { label: "2-3 Months", days: "61-90 days", amount: 0, invoiceCount: 0 },
            { label: "3+ Months", days: "90+ days", amount: 0, invoiceCount: 0 },
        ]

        const unpaidSales = sales.filter((s) => s.paymentStatus !== "paid")
        for (const s of unpaidSales) {
            const dueDate = s.dueDate || s.invoiceDate
            const diffDays = Math.floor(
                (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            const outstanding = s.balanceDue
            if (diffDays <= 30) {
                ageBuckets[0].amount += outstanding
                ageBuckets[0].invoiceCount++
            } else if (diffDays <= 60) {
                ageBuckets[1].amount += outstanding
                ageBuckets[1].invoiceCount++
            } else if (diffDays <= 90) {
                ageBuckets[2].amount += outstanding
                ageBuckets[2].invoiceCount++
            } else {
                ageBuckets[3].amount += outstanding
                ageBuckets[3].invoiceCount++
            }
        }

        const allDates = [
            ...sales.map((s) => s.invoiceDate),
            ...purchases.map((p) => p.invoiceDate),
            ...payments.map((p) => p.paymentDate),
        ].sort((a, b) => b.getTime() - a.getTime())

        return {
            totalSales,
            totalPurchases,
            totalPaymentsIn: totalPaymentsIn + salesPaid,
            totalPaymentsOut: totalPaymentsOut + purchasesPaid,
            outstandingBalance: Math.abs(net),
            balanceType: net >= 0 ? "debit" : "credit",
            lastTransactionDate: allDates[0] || null,
            aging: ageBuckets,
        }
    } catch (error) {
        console.error("Error fetching party summary:", error)
        throw new Error("Failed to fetch party summary")
    }
}
