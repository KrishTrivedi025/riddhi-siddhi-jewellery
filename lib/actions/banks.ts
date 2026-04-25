"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { BankAccountFormValues } from "../schemas/bank-schema"

// ─── List Accounts ───────────────────────────────────────────────────────────

export async function getBankAccounts() {
    try {
        // 1. Ensure "Cash in Hand" exists
        const cashAccount = await prisma.bankAccount.findFirst({
            where: { isCash: true, deletedAt: null }
        })

        if (!cashAccount) {
            await prisma.bankAccount.create({
                data: {
                    accountName: "Cash in Hand",
                    isCash: true,
                    isDefault: true,
                    openingBalance: 0,
                    currentBalance: 0,
                }
            })
        }

        const accounts = await prisma.bankAccount.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" }
        })
        return accounts
    } catch (error) {
        console.error("Error fetching bank accounts:", error)
        throw new Error("Failed to fetch accounts")
    }
}

// ─── Upsert Account ──────────────────────────────────────────────────────────

export async function upsertBankAccount(data: BankAccountFormValues, id?: string) {
    try {
        if (id) {
            // Update
            const existing = await prisma.bankAccount.findUnique({ where: { id } })
            if (!existing) throw new Error("Account not found")

            const result = await prisma.bankAccount.update({
                where: { id },
                data: {
                    accountName: data.accountName,
                    bankName: data.bankName,
                    accountNumber: data.accountNumber,
                    ifscCode: data.ifscCode,
                    branchName: data.branchName,
                    upiId: data.upiId,
                    // Note: openingBalance and currentBalance should NOT be updated via simple edit
                    // unless you're implementing re-calc logic, staying simple for now.
                }
            })
            revalidatePath("/dashboard/banks")
            return { success: true, data: result }
        } else {
            // Create
            const result = await prisma.bankAccount.create({
                data: {
                    ...data,
                    currentBalance: data.openingBalance,
                }
            })
            revalidatePath("/dashboard/banks")
            return { success: true, data: result }
        }
    } catch (error: any) {
        console.error("Error upserting bank account:", error)
        return { success: false, error: error.message || "Failed to save account" }
    }
}

// ─── Delete Account ──────────────────────────────────────────────────────────

export async function deleteBankAccount(id: string) {
    try {
        const account = await prisma.bankAccount.findUnique({ where: { id } })
        if (!account) throw new Error("Account not found")
        
        if (account.isCash) {
            throw new Error("Cannot delete the primary Cash account.")
        }

        // Soft delete
        await prisma.bankAccount.update({
            where: { id },
            data: { deletedAt: new Date() }
        })

        revalidatePath("/dashboard/banks")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting bank account:", error)
        return { success: false, error: error.message || "Failed to delete account" }
    }
}

// ─── Get Single Account ──────────────────────────────────────────────────────

export async function getBankAccountById(id: string) {
    try {
        const account = await prisma.bankAccount.findUnique({
            where: { id, deletedAt: null }
        })
        return account
    } catch (error) {
        console.error("Error fetching bank account:", error)
        throw new Error("Failed to fetch account")
    }
}
