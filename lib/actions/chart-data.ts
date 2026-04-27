"use server"

import { prisma } from "@/lib/db"
import { requireUserId } from "./auth-helper"
import {
    subMonths,
    startOfMonth,
    endOfMonth,
    format,
    eachMonthOfInterval,
    isWithinInterval
} from "date-fns"

export async function getChartData() {
    try {
        const userId = await requireUserId()
        const today = new Date()
        const sixMonthsAgo = startOfMonth(subMonths(today, 5))

        const sales = await prisma.saleInvoice.findMany({
            where: { userId, status: "active", deletedAt: null, invoiceDate: { gte: sixMonthsAgo } },
            select: { invoiceDate: true, grandTotal: true }
        })
        const purchases = await prisma.purchaseInvoice.findMany({
            where: { userId, status: "active", deletedAt: null, invoiceDate: { gte: sixMonthsAgo } },
            select: { invoiceDate: true, grandTotal: true }
        })
        const expenses = await prisma.expense.findMany({
            where: { userId, deletedAt: null, expenseDate: { gte: sixMonthsAgo } },
            select: { expenseDate: true, amount: true }
        })

        const months = eachMonthOfInterval({ start: sixMonthsAgo, end: today })
        const monthlyData = months.map(month => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)
            const monthLabel = format(month, "MMM")
            const monthSales = sales.filter(s => isWithinInterval(s.invoiceDate, { start: monthStart, end: monthEnd })).reduce((acc, curr) => acc + curr.grandTotal, 0)
            const monthPurchases = purchases.filter(p => isWithinInterval(p.invoiceDate, { start: monthStart, end: monthEnd })).reduce((acc, curr) => acc + curr.grandTotal, 0)
            const monthExpenses = expenses.filter(e => isWithinInterval(e.expenseDate, { start: monthStart, end: monthEnd })).reduce((acc, curr) => acc + curr.amount, 0)
            return { month: monthLabel, sales: monthSales, purchases: monthPurchases, profit: monthSales - monthPurchases - monthExpenses }
        })

        const paymentStats = await prisma.saleInvoice.aggregate({
            where: { userId, status: "active", deletedAt: null },
            _sum: { amountPaid: true, balanceDue: true }
        })
        const donutData = [
            { name: "Paid", value: paymentStats._sum.amountPaid || 0, color: "#22C55E" },
            { name: "Outstanding", value: paymentStats._sum.balanceDue || 0, color: "#EF4444" },
        ]

        const customerSales = await prisma.saleInvoice.groupBy({
            by: ['partyId'],
            where: { userId, status: "active", deletedAt: null },
            _sum: { grandTotal: true },
            orderBy: { _sum: { grandTotal: 'desc' } },
            take: 5
        })
        const partyIds = customerSales.map(cs => cs.partyId)
        const partiesList = await prisma.party.findMany({ where: { id: { in: partyIds } }, select: { id: true, name: true } })
        const topCustomers = customerSales.map(cs => {
            const party = partiesList.find(p => p.id === cs.partyId)
            return { name: party?.name || "Unknown", value: cs._sum.grandTotal || 0 }
        })

        return { monthlyData, donutData, topCustomers }
    } catch (error) {
        console.error("Error fetching chart data:", error)
        throw new Error("Failed to fetch dashboard chart data")
    }
}
