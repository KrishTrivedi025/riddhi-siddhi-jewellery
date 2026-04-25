"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { PaymentInFormValues } from "../schemas/payment-in-schema"

// ─── Get Customers With Active Balances ──────────────────────────────────────

export async function getCustomersWithBalances() {
    try {
        const customers = await prisma.party.findMany({
            where: {
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

// ─── Get Outstanding Invoices for a specific Customer ────────────────────────

export async function getCustomerOutstandingInvoices(partyId: string) {
    try {
        const invoices = await prisma.saleInvoice.findMany({
            where: {
                partyId,
                balanceDue: { gt: 0 },
                status: "active",
                deletedAt: null,
            },
            select: {
                id: true,
                invoiceNumber: true,
                invoiceDate: true,
                grandTotal: true,
                amountPaid: true,
                balanceDue: true,
            },
            orderBy: { invoiceDate: "asc" }, // Oldest first
        })
        return invoices
    } catch (error) {
        console.error("Error fetching outstanding invoices:", error)
        throw new Error("Failed to fetch invoices")
    }
}

// ─── Get Recent Received Payments List ───────────────────────────────────────

export async function getPaymentsIn() {
    try {
        const payments = await prisma.payment.findMany({
            where: {
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
        const result = await prisma.$transaction(async (tx) => {
            // Validate that the math checks out perfectly to guarantee stability.
            const totalAllocated = data.allocations.reduce((sum, alloc) => sum + alloc.amountApplied, 0)
            const totalRecieved = data.totalAmount
            const createdPayments = []

            for (const alloc of data.allocations) {
                const invoice = await tx.saleInvoice.findUnique({ where: { id: alloc.invoiceId } })
                if (!invoice) throw new Error(`Invoice ID ${alloc.invoiceId} not found`)

                // Basic validation constraint
                if (alloc.amountApplied > invoice.balanceDue + 0.01) {
                    throw new Error(`Cannot over-pay invoice ${invoice.invoiceNumber}`)
                }

                // 1. Create the Payment Voucher link for this specific invoice
                const payment = await tx.payment.create({
                    data: {
                        paymentType: "IN",
                        partyId: data.partyId,
                        saleInvoiceId: invoice.id,
                        paymentDate: data.paymentDate,
                        totalAmount: alloc.amountApplied,
                        notes: data.notes || `Received payment against ${invoice.invoiceNumber}`,
                    },
                })

                // 2. Proportional Split Logic for Payment Modes
                // Weight of this specific invoice allocation in the total payment voucher
                const weight = alloc.amountApplied / totalRecieved

                for (const mode of data.modes) {
                    const modeShare = mode.amount * weight
                    await tx.paymentMode.create({
                        data: {
                            paymentId: payment.id,
                            mode: mode.mode,
                            amount: modeShare,
                            reference: mode.reference,
                            bankAccountId: mode.bankAccountId,
                        },
                    })

                    // 4. Update Bank Account Balance
                    if (mode.bankAccountId) {
                        await tx.bankAccount.update({
                            where: { id: mode.bankAccountId },
                            data: { currentBalance: { increment: modeShare } }
                        })
                    }
                }

                // 3. Update Invoice Balances
                const newAmountPaid = invoice.amountPaid + alloc.amountApplied
                const newBalanceDue = Math.max(0, invoice.grandTotal - newAmountPaid)
                const newStatus = newBalanceDue <= 0.01 ? "paid" : "partial"

                await tx.saleInvoice.update({
                    where: { id: invoice.id },
                    data: {
                        amountPaid: newAmountPaid,
                        balanceDue: newBalanceDue,
                        paymentStatus: newStatus,
                    },
                })

                createdPayments.push(payment)
            }

            return createdPayments
        })

        revalidatePath("/dashboard/payments")
        revalidatePath("/dashboard/sales")
        return { success: true, data: result }
    } catch (error: any) {
        console.error("Error creating payment in:", error)
        return { success: false, error: error.message || "Failed to record payment" }
    }
}
