"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireUserId } from "./auth-helper"

export interface TransferData {
    fromAccountId: string
    toAccountId: string
    amount: number
    transferDate: Date
    notes?: string
}

export async function createTransfer(data: TransferData) {
    try {
        const userId = await requireUserId()
        if (data.fromAccountId === data.toAccountId) {
            throw new Error("Cannot transfer money to the same account.")
        }

        const result = await prisma.$transaction(async (tx) => {
            const transfer = await tx.accountTransfer.create({
                data: {
                    userId,
                    fromAccountId: data.fromAccountId,
                    toAccountId: data.toAccountId,
                    amount: data.amount,
                    transferDate: data.transferDate,
                    notes: data.notes,
                }
            })

            // 2. Decrement From Account
            await tx.bankAccount.update({
                where: { id: data.fromAccountId },
                data: { currentBalance: { decrement: data.amount } }
            })

            // 3. Increment To Account
            await tx.bankAccount.update({
                where: { id: data.toAccountId },
                data: { currentBalance: { increment: data.amount } }
            })

            return transfer
        })

        revalidatePath("/dashboard/banks")
        return { success: true, data: result }
    } catch (error: any) {
        console.error("Transfer Error:", error)
        return { success: false, error: error.message || "Failed to complete transfer" }
    }
}

export async function getAccountTransactions(accountId: string) {
    try {
        // 1. Fetch Payment Modes (linked to Sale/Purchase payments)
        const paymentModes = await prisma.paymentMode.findMany({
            where: {
                bankAccountId: accountId,
                payment: { deletedAt: null }
            },
            include: {
                payment: {
                    include: {
                        party: { select: { name: true } },
                        saleInvoice: { select: { invoiceNumber: true } },
                        purchaseInvoice: { select: { invoiceNumber: true } }
                    }
                }
            }
        })

        // 2. Fetch Transfers
        const transfersFrom = await prisma.accountTransfer.findMany({
            where: { fromAccountId: accountId },
            include: { toAccount: { select: { accountName: true } } }
        })

        const transfersTo = await prisma.accountTransfer.findMany({
            where: { toAccountId: accountId },
            include: { fromAccount: { select: { accountName: true } } }
        })

        // 3. Fetch Expenses
        const expenses = await prisma.expense.findMany({
            where: { bankAccountId: accountId, deletedAt: null }
        })

        // normalization
        const transactions = [
            ...paymentModes.map(pm => ({
                id: pm.id,
                date: pm.payment.paymentDate,
                type: pm.payment.paymentType === "IN" ? "Payment Received" : "Payment Made",
                mode: pm.mode,
                party: pm.payment.party.name,
                reference: pm.payment.saleInvoice?.invoiceNumber || pm.payment.purchaseInvoice?.invoiceNumber,
                amount: pm.payment.paymentType === "IN" ? pm.amount : -pm.amount,
                notes: pm.payment.notes,
                category: "Payment"
            })),
            ...transfersFrom.map(t => ({
                id: t.id,
                date: t.transferDate,
                type: "Transfer Out",
                party: t.toAccount.accountName,
                reference: "Inter-account Transfer",
                amount: -t.amount,
                notes: t.notes,
                category: "Transfer"
            })),
            ...transfersTo.map(t => ({
                id: t.id,
                date: t.transferDate,
                type: "Transfer In",
                party: t.fromAccount.accountName,
                reference: "Inter-account Transfer",
                amount: t.amount,
                notes: t.notes,
                category: "Transfer"
            })),
            ...expenses.map(e => ({
                id: e.id,
                date: e.expenseDate,
                type: "Expense",
                party: e.category,
                reference: e.description || "Business Expense",
                amount: -e.amount,
                notes: e.description,
                category: "Expense"
            }))
        ]

        // Sort by date desc and filter out zero amount entries
        return transactions
            .filter(t => Math.abs(t.amount) > 0.001)
            .sort((a, b) => b.date.getTime() - a.date.getTime())
    } catch (error) {
        console.error("Fetch Transactions Error:", error)
        throw new Error("Failed to fetch account transaction history")
    }
}
