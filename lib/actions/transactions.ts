"use server"

import { prisma } from "@/lib/db"

export type TransactionType = "Sale" | "Purchase" | "Payment"

export interface Transaction {
    id: string
    type: TransactionType
    partyName: string
    amount: number
    date: Date
    status?: string
    referenceNumber: string
}

export async function getRecentTransactions(): Promise<Transaction[]> {
    try {
        // Fetch data sequentially to avoid connection timeout
        const sales = await prisma.saleInvoice.findMany({
            where: { status: "active", deletedAt: null },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { party: { select: { name: true } } }
        })
        const purchases = await prisma.purchaseInvoice.findMany({
            where: { status: "active", deletedAt: null },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { party: { select: { name: true } } }
        })
        const payments = await prisma.payment.findMany({
            where: { deletedAt: null },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { party: { select: { name: true } } }
        })

        const normalizedSales: Transaction[] = sales.map(s => ({
            id: s.id,
            type: "Sale",
            partyName: s.party.name,
            amount: s.grandTotal,
            date: s.createdAt,
            status: s.paymentStatus,
            referenceNumber: s.invoiceNumber
        }))

        const normalizedPurchases: Transaction[] = purchases.map(p => ({
            id: p.id,
            type: "Purchase",
            partyName: p.party.name,
            amount: p.grandTotal,
            date: p.createdAt,
            status: p.paymentStatus,
            referenceNumber: p.invoiceNumber
        }))

        const normalizedPayments: Transaction[] = payments.map(pm => ({
            id: pm.id,
            type: "Payment",
            partyName: pm.party.name,
            amount: pm.totalAmount,
            date: pm.createdAt,
            status: "completed",
            referenceNumber: pm.paymentType.toUpperCase() // e.g. "IN" or "OUT"
        }))

        // Combine and take top 10
        const allTransactions = [...normalizedSales, ...normalizedPurchases, ...normalizedPayments]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 10)

        return allTransactions
    } catch (error) {
        console.error("Error fetching recent transactions:", error)
        throw new Error("Failed to fetch dashboard transactions")
    }
}
