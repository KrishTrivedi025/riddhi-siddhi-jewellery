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

// ─── Get Single Payment (for editing) ────────────────────────────────────────

export async function getPaymentInById(id: string) {
    try {
        const userId = await requireUserId()
        const payment = await prisma.payment.findFirst({
            where: { id, userId, paymentType: "IN", deletedAt: null },
            include: {
                party: { select: { id: true, name: true } },
                paymentModes: true,
                saleInvoice: { select: { id: true, invoiceNumber: true, isGst: true } },
            },
        })
        return payment
    } catch (error) {
        console.error("Error fetching payment:", error)
        throw new Error("Failed to fetch payment")
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

// ─── Update Payment In ────────────────────────────────────────────────────────

export async function updatePaymentIn(id: string, data: PaymentInFormValues) {
    try {
        const userId = await requireUserId()

        const modesTotal = data.modes.reduce((sum, m) => sum + m.amount, 0)
        if (Math.abs(modesTotal - data.totalAmount) > 0.01) {
            return { success: false, error: `Payment methods (₹${modesTotal}) don't add up to the total received (₹${data.totalAmount})` }
        }

        await prisma.$transaction(async (tx) => {
            const existing = await tx.payment.findFirst({
                where: { id, userId, paymentType: "IN" },
                include: { paymentModes: true },
            })
            if (!existing) throw new Error("Payment not found")

            // Reverse the old mode amounts from bank balances before applying the new ones
            for (const mode of existing.paymentModes) {
                if (mode.bankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: mode.bankAccountId },
                        data: { currentBalance: { decrement: mode.amount } },
                    })
                }
            }
            await tx.paymentMode.deleteMany({ where: { paymentId: id } })

            // Legacy payments tied to one specific invoice keep that tie — reconcile
            // that invoice's balance with the amount delta. New/unallocated payments
            // (saleInvoiceId null) don't touch any invoice.
            if (existing.saleInvoiceId) {
                const invoice = await tx.saleInvoice.findUnique({ where: { id: existing.saleInvoiceId } })
                if (invoice) {
                    const newAmountPaid = Math.max(0, invoice.amountPaid - existing.totalAmount + data.totalAmount)
                    const newBalanceDue = Math.max(0, invoice.grandTotal - newAmountPaid)
                    const newStatus = newBalanceDue <= 0.01 ? "paid" : newAmountPaid > 0 ? "partial" : "unpaid"
                    await tx.saleInvoice.update({
                        where: { id: invoice.id },
                        data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue, paymentStatus: newStatus },
                    })
                }
            }

            await tx.payment.update({
                where: { id },
                data: {
                    isGst: existing.saleInvoiceId ? existing.isGst : data.isGst,
                    paymentDate: data.paymentDate,
                    totalAmount: data.totalAmount,
                    notes: data.notes || null,
                },
            })

            for (const mode of data.modes) {
                if (mode.amount <= 0) continue

                await tx.paymentMode.create({
                    data: {
                        paymentId: id,
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
        })

        revalidatePath("/dashboard/payments")
        revalidatePath("/dashboard/parties")
        revalidatePath("/dashboard/sales")
        return { success: true }
    } catch (error: any) {
        console.error("Error updating payment in:", error)
        return { success: false, error: error.message || "Failed to update payment" }
    }
}
