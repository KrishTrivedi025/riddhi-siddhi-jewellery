"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { BankAccountFormValues } from "../schemas/bank-schema"
import { requireUserId } from "./auth-helper"

export async function getBankAccounts() {
    try {
        const userId = await requireUserId()
        const cashAccount = await prisma.bankAccount.findFirst({
            where: { userId, isCash: true, deletedAt: null }
        })
        if (!cashAccount) {
            await prisma.bankAccount.create({
                data: { userId, accountName: "Cash in Hand", isCash: true, isDefault: true, openingBalance: 0, currentBalance: 0 }
            })
        }
        return await prisma.bankAccount.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: "asc" } })
    } catch (error) {
        console.error("Error fetching bank accounts:", error)
        throw new Error("Failed to fetch accounts")
    }
}

export async function upsertBankAccount(data: BankAccountFormValues, id?: string) {
    try {
        const userId = await requireUserId()
        if (id) {
            const existing = await prisma.bankAccount.findFirst({ where: { id, userId } })
            if (!existing) throw new Error("Account not found")
            const result = await prisma.bankAccount.update({
                where: { id },
                data: { accountName: data.accountName, bankName: data.bankName, accountNumber: data.accountNumber, ifscCode: data.ifscCode, branchName: data.branchName, upiId: data.upiId }
            })
            revalidatePath("/dashboard/banks")
            return { success: true, data: result }
        } else {
            const result = await prisma.bankAccount.create({
                data: { ...data, userId, currentBalance: data.openingBalance }
            })
            revalidatePath("/dashboard/banks")
            return { success: true, data: result }
        }
    } catch (error: any) {
        console.error("Error upserting bank account:", error)
        return { success: false, error: error.message || "Failed to save account" }
    }
}

export async function deleteBankAccount(id: string) {
    try {
        const userId = await requireUserId()
        const account = await prisma.bankAccount.findFirst({ where: { id, userId } })
        if (!account) throw new Error("Account not found")
        if (account.isCash) throw new Error("Cannot delete the primary Cash account.")
        await prisma.bankAccount.update({ where: { id }, data: { deletedAt: new Date() } })
        revalidatePath("/dashboard/banks")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting bank account:", error)
        return { success: false, error: error.message || "Failed to delete account" }
    }
}

export async function getBankAccountById(id: string) {
    try {
        const userId = await requireUserId()
        return await prisma.bankAccount.findFirst({ where: { id, userId, deletedAt: null } })
    } catch (error) {
        console.error("Error fetching bank account:", error)
        throw new Error("Failed to fetch account")
    }
}
