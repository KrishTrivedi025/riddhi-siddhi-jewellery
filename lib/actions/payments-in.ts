"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { PaymentInFormValues } from "../schemas/payment-in-schema"
import { requireUserId } from "./auth-helper"

// ─── Get Customers With Active Balances ──────────────────────────────────────

export async function getCustomersWithBalances() {
    try {
        const userId = await requireUserId()
        const customers = await prisma.party.findMany({
            where: {
                userId,
                partyType: "CUSTOMER",
                deletedAt: null,
                saleInvoices: {
                    some: {
                        balanceDue: { gt: 0 },
                        status: "active",
                        deletedAt: null,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                phone: true,
            },
            orderBy: { name: "asc" },
        })
        return customers
    } catch (error) {
        console.error("Error fetching customers with balances:", error)
        throw new Error("Failed to fetch customers")
    }
}

// ─── Get Recent Received Payments List ───────────────────────────────────────

export async function getPaymentsIn() {
    try {
        const userId = await requireUserId()
        const payments = await prisma.payment.findMany({
            where: {
                userId,
                paymentType: "IN",
                deletedAt: null,
            },
            include: {
                party: { select: { id: true, name: true } },
                saleInvoice: { select: { invoiceNumber: true } },
                paymentModes: true,
            },
            orderBy: { paymentDate: "desc" },
        })
        return payments
    } catch (error) {
        console.error("Error fetching payments in:", error)
        throw new Error("Failed to fetch payments")
    }
}

// ─── Create Formatted Payment In Record ──────────────────────────────────────

export async function createPaymentIn(data: PaymentInFormValues) {
    try {
        const userId = await requireUserId()

        const modesTotal = data.modes.reduce((sum, m) => sum + m.amount, 0)
        if (Math.abs(modesTotal - data.totalAmount) > 0.01) {
            return { success: false, error: `Payment methods (₹${modesTotal}) don't add up to the total received (₹${data.totalAmount})` }
        }

        const result = await prisma.$transaction(async (tx) => {
            // A single, unallocated payment — not tied to any specific invoice. The
            // client receives payments randomly, not against particular bills, so this
            // only records money received against the party overall (see the party
            // ledger, which folds isGst-matching unallocated payments into Outstanding).
            const payment = await tx.payment.create({
                data: {
                    userId,
                    paymentType: "IN",
                    partyId: data.partyId,
                    isGst: data.isGst,
                    paymentDate: data.paymentDate,
                    totalAmount: data.totalAmount,
                    notes: data.notes || null,
                },
            })

            for (const mode of data.modes) {
                if (mode.amount <= 0) continue

                await tx.paymentMode.create({
                    data: {
                        paymentId: payment.id,
                        mode: mode.mode,
                        amount: mode.amount,
                        reference: mode.reference,
                        bankAccountId: mode.bankAccountId,
                    },
                })

                if (mode.bankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: mode.bankAccountId },
                        data: { currentBalance: { increment: mode.amount } },
                    })
                }
            }

            return payment
        })

        revalidatePath("/dashboard/payments")
        revalidatePath("/dashboard/parties")
        return { success: true, data: result }
    } catch (error: any) {
        console.error("Error creating payment in:", error)
        return { success: false, error: error.message || "Failed to record payment" }
    }
}
