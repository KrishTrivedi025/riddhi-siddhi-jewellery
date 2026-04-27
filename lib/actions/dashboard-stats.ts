"use server"

import { prisma } from "@/lib/db"
import { requireUserId } from "./auth-helper"

export async function getDashboardStats() {
    try {
        const userId = await requireUserId()

        const salesStats = await prisma.saleInvoice.aggregate({
            where: { userId, status: "active", deletedAt: null },
            _sum: { grandTotal: true, balanceDue: true }
        })

        const purchaseStats = await prisma.purchaseInvoice.aggregate({
            where: { userId, status: "active", deletedAt: null },
            _sum: { grandTotal: true, balanceDue: true }
        })

        const expenseStats = await prisma.expense.aggregate({
            where: { userId, deletedAt: null },
            _sum: { amount: true }
        })

        const itemStats = await prisma.item.findMany({
            where: { userId, deletedAt: null },
            select: { currentStock: true, purchasePrice: true }
        })

        const accountStats = await prisma.bankAccount.aggregate({
            where: { userId, deletedAt: null },
            _sum: { currentBalance: true }
        })

        const cashStats = await prisma.bankAccount.aggregate({
            where: { userId, deletedAt: null, isCash: true },
            _sum: { currentBalance: true }
        })

        const totalSales = salesStats._sum.grandTotal || 0
        const totalReceivable = salesStats._sum.balanceDue || 0
        const totalPurchases = purchaseStats._sum.grandTotal || 0
        const totalPayable = purchaseStats._sum.balanceDue || 0
        const totalExpenses = expenseStats._sum.amount || 0
        const inventoryValue = itemStats.reduce((acc, curr) => acc + (curr.currentStock * (curr.purchasePrice || 0)), 0)
        const cashBalance = cashStats._sum.currentBalance || 0
        const bankBalance = (accountStats._sum.currentBalance || 0) - cashBalance
        const netProfit = totalSales - totalPurchases - totalExpenses

        return { totalSales, totalPurchases, totalReceivable, totalPayable, netProfit, inventoryValue, cashBalance, bankBalance }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        throw new Error("Failed to fetch dashboard statistics")
    }
}
