"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireUserId } from "./auth-helper"

/**
 * Migration Utility:
 * 1. Links all orphaned PaymentModes to correct BankAccounts (based on mode).
 * 2. Recalculates currentBalance for all accounts from scratch.
 */
export async function syncAndRecalculateBalances() {
    try {
        const userId = await requireUserId()
        console.log("Starting balance sync...")

        const cashAccount = await prisma.bankAccount.findFirst({
            where: { userId, isCash: true, deletedAt: null }
        })
        const firstBankAccount = await prisma.bankAccount.findFirst({
            where: { userId, isCash: false, deletedAt: null }
        })

        if (!cashAccount) throw new Error("Cash account not found")

        // 2. Link orphaned payments
        console.log("Linking orphaned payments...")
        
        // Fix Cash payments
        await prisma.paymentMode.updateMany({
            where: { 
                bankAccountId: null,
                mode: "cash"
            },
            data: { bankAccountId: cashAccount.id }
        })

        // Fix Bank payments (default to first bank account if found)
        if (firstBankAccount) {
            await prisma.paymentMode.updateMany({
                where: { 
                    bankAccountId: null,
                    mode: { in: ["bank", "upi", "cheque", "card"] }
                },
                data: { bankAccountId: firstBankAccount.id }
            })
        }

        // 3. Recalculate everything for each account
        const allAccounts = await prisma.bankAccount.findMany({
            where: { userId, deletedAt: null }
        })

        for (const acc of allAccounts) {
            console.log(`Recalculating balance for: ${acc.accountName}`)

            // Sum all "Payment In"
            const totalIn = await prisma.paymentMode.aggregate({
                where: { 
                    bankAccountId: acc.id, 
                    payment: { paymentType: "IN", deletedAt: null } 
                },
                _sum: { amount: true }
            })

            // Sum all "Payment Out"
            const totalOut = await prisma.paymentMode.aggregate({
                where: { 
                    bankAccountId: acc.id, 
                    payment: { paymentType: "OUT", deletedAt: null } 
                },
                _sum: { amount: true }
            })

            // Sum all "Transfers In"
            const transfersIn = await prisma.accountTransfer.aggregate({
                where: { toAccountId: acc.id },
                _sum: { amount: true }
            })

            // Sum all "Transfers Out"
            const transfersOut = await prisma.accountTransfer.aggregate({
                where: { fromAccountId: acc.id },
                _sum: { amount: true }
            })

            // TODO: Sum Expenses if linked (Expenses current schema doesn't have bankAccountId? Let's check)
            
            const newBalance = (acc.openingBalance || 0) + 
                               (totalIn._sum.amount || 0) - 
                               (totalOut._sum.amount || 0) + 
                               (transfersIn._sum.amount || 0) - 
                               (transfersOut._sum.amount || 0)

            await prisma.bankAccount.update({
                where: { id: acc.id },
                data: { currentBalance: newBalance }
            })
        }

        revalidatePath("/dashboard/banks")
        console.log("Sync complete!")
        return { success: true }
    } catch (error: any) {
        console.error("Sync error:", error)
        return { success: false, error: error.message }
    }
}
