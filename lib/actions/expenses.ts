"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ExpenseFormValues } from "@/lib/schemas/expense-schema"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExpenseFilters {
    startDate?: Date
    endDate?: Date
    category?: string
}

// ─── List Expenses ────────────────────────────────────────────────────────────

export async function getExpenses(filters?: ExpenseFilters) {
    try {
        const where: any = { deletedAt: null }

        if (filters?.startDate || filters?.endDate) {
            where.expenseDate = {}
            if (filters.startDate) where.expenseDate.gte = filters.startDate
            if (filters.endDate)   where.expenseDate.lte = filters.endDate
        }

        if (filters?.category && filters.category !== "all") {
            where.category = filters.category
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                bankAccount: { select: { id: true, accountName: true, isCash: true } },
            },
            orderBy: { expenseDate: "desc" },
        })

        return expenses
    } catch (error) {
        console.error("Error fetching expenses:", error)
        throw new Error("Failed to fetch expenses")
    }
}

// ─── Get Single Expense ───────────────────────────────────────────────────────

export async function getExpenseById(id: string) {
    try {
        return await prisma.expense.findUnique({
            where: { id, deletedAt: null },
            include: {
                bankAccount: { select: { id: true, accountName: true, isCash: true } },
            },
        })
    } catch (error) {
        console.error("Error fetching expense:", error)
        throw new Error("Failed to fetch expense")
    }
}

// ─── Upsert Expense ───────────────────────────────────────────────────────────

export async function upsertExpense(data: ExpenseFormValues, id?: string) {
    try {
        const totalDebit = data.amount // amount entered is the base amount; GST tracked separately

        if (id) {
            // ── Update ─────────────────────────────────────────────────────
            const existing = await prisma.expense.findUnique({ where: { id } })
            if (!existing) throw new Error("Expense not found")

            await prisma.$transaction(async (tx) => {
                // 1. Restore old bank balance (reverse the old debit)
                if (existing.bankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: existing.bankAccountId },
                        data: { currentBalance: { increment: existing.amount } },
                    })
                }

                // 2. Update the expense record
                await tx.expense.update({
                    where: { id },
                    data: {
                        expenseDate:   data.expenseDate,
                        category:      data.category,
                        description:   data.description,
                        amount:        data.amount,
                        gstRate:       data.gstRate,
                        gstAmount:     data.gstAmount,
                        bankAccountId: data.bankAccountId || null,
                        receiptUrl:    data.receiptUrl,
                    },
                })

                // 3. Apply new debit to new bank account
                if (data.bankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: data.bankAccountId },
                        data: { currentBalance: { decrement: data.amount } },
                    })
                }
            })
        } else {
            // ── Create ─────────────────────────────────────────────────────
            await prisma.$transaction(async (tx) => {
                // 1. Create expense
                await tx.expense.create({
                    data: {
                        expenseDate:   data.expenseDate,
                        category:      data.category,
                        description:   data.description,
                        amount:        data.amount,
                        gstRate:       data.gstRate,
                        gstAmount:     data.gstAmount,
                        bankAccountId: data.bankAccountId || null,
                        receiptUrl:    data.receiptUrl,
                    },
                })

                // 2. Debit the bank/cash account
                if (data.bankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: data.bankAccountId },
                        data: { currentBalance: { decrement: data.amount } },
                    })
                }
            })
        }

        revalidatePath("/dashboard/expenses")
        revalidatePath("/dashboard/banks")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Error upserting expense:", error)
        return { success: false, error: error.message || "Failed to save expense" }
    }
}

// ─── Delete Expense ───────────────────────────────────────────────────────────

export async function deleteExpense(id: string) {
    try {
        const existing = await prisma.expense.findUnique({ where: { id } })
        if (!existing) throw new Error("Expense not found")

        await prisma.$transaction(async (tx) => {
            // 1. Soft-delete the expense
            await tx.expense.update({
                where: { id },
                data: { deletedAt: new Date() },
            })

            // 2. Restore the bank account balance
            if (existing.bankAccountId) {
                await tx.bankAccount.update({
                    where: { id: existing.bankAccountId },
                    data: { currentBalance: { increment: existing.amount } },
                })
            }
        })

        revalidatePath("/dashboard/expenses")
        revalidatePath("/dashboard/banks")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting expense:", error)
        return { success: false, error: error.message || "Failed to delete expense" }
    }
}

// ─── Expense Summary (KPI + Category Breakdown) ───────────────────────────────

export async function getExpenseSummary(filters?: ExpenseFilters) {
    try {
        const where: any = { deletedAt: null }

        if (filters?.startDate || filters?.endDate) {
            where.expenseDate = {}
            if (filters.startDate) where.expenseDate.gte = filters.startDate
            if (filters.endDate)   where.expenseDate.lte = filters.endDate
        }

        const expenses = await prisma.expense.findMany({ where })

        const totalAmount    = expenses.reduce((s, e) => s + e.amount, 0)
        const totalGstCredit = expenses.reduce((s, e) => s + e.gstAmount, 0)
        const count          = expenses.length

        // Category breakdown
        const categoryMap: Record<string, number> = {}
        for (const e of expenses) {
            categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount
        }

        const categoryBreakdown = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)

        return { totalAmount, totalGstCredit, count, categoryBreakdown }
    } catch (error) {
        console.error("Error fetching expense summary:", error)
        throw new Error("Failed to fetch expense summary")
    }
}

// ─── Monthly Expense Trend (last 6 months) ────────────────────────────────────

export async function getMonthlyExpenseTrend() {
    try {
        const now = new Date()
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

        const expenses = await prisma.expense.findMany({
            where: {
                deletedAt:   null,
                expenseDate: { gte: sixMonthsAgo },
            },
            select: { expenseDate: true, amount: true },
        })

        // Build month buckets
        const months: { month: string; amount: number }[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            months.push({
                month: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
                amount: 0,
            })
        }

        for (const e of expenses) {
            const d = new Date(e.expenseDate)
            const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" })
            const bucket = months.find((m) => m.month === label)
            if (bucket) bucket.amount += e.amount
        }

        return months
    } catch (error) {
        console.error("Error fetching monthly expense trend:", error)
        throw new Error("Failed to fetch monthly trend")
    }
}
