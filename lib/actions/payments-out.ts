"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { PaymentOutFormValues } from "../schemas/payment-out-schema"

// ─── List Payments Out ───────────────────────────────────────────────────────

export async function getPaymentsOut() {
    try {
        const payments = await prisma.payment.findMany({
            where: { paymentType: "OUT", deletedAt: null },
            include: {
                party: { select: { name: true } },
                purchaseInvoice: { select: { invoiceNumber: true } },
                paymentModes: true,
            },
            orderBy: { paymentDate: "desc" },
        })
        return payments
    } catch (error) {
        console.error("Error fetching payments out:", error)
        throw new Error("Failed to fetch payments")
    }
}

// ─── Suppliers with Balance ──────────────────────────────────────────────────

export async function getSuppliersWithBalances() {
    try {
        // Find suppliers with non-zero purchase invoice balances or non-zero opening balance
        const parties = await prisma.party.findMany({
            where: {
                partyType: "SUPPLIER",
                deletedAt: null,
                OR: [
                    { purchaseInvoices: { some: { balanceDue: { gt: 0 } } } },
                    { openingBalance: { gt: 0 }, balanceType: "credit" },
                ],
            },
            select: {
                id: true,
                name: true,
                openingBalance: true,
                balanceType: true,
                purchaseInvoices: {
                    where: { balanceDue: { gt: 0 }, status: "active", deletedAt: null },
                    select: { balanceDue: true },
                },
            },
        })

        return parties.map((p) => {
            const invoiceBalance = p.purchaseInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0)
            const openingBalance = p.balanceType === "credit" ? p.openingBalance : -p.openingBalance
            return {
                id: p.id,
                name: p.name,
                balance: invoiceBalance + openingBalance,
            }
        })
    } catch (error) {
        console.error("Error fetching suppliers:", error)
        throw new Error("Failed to fetch suppliers")
    }
}

// ─── Supplier Outstanding Invoices ───────────────────────────────────────────

export async function getSupplierOutstandingInvoices(partyId: string) {
    try {
        return await prisma.purchaseInvoice.findMany({
            where: {
                partyId,
                balanceDue: { gt: 0 },
                status: "active",
                deletedAt: null,
            },
            orderBy: { invoiceDate: "asc" },
        })
    } catch (error) {
        console.error("Error fetching supplier invoices:", error)
        throw new Error("Failed to fetch invoices")
    }
}

// ─── Create Payment Out (with Proportional Split Support) ─────────────────────

export async function createPaymentOut(data: PaymentOutFormValues) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const totalRecieved = data.totalAmount

            const createdPayments = []

            for (const alloc of data.allocations) {
                const invoice = await tx.purchaseInvoice.findUnique({ where: { id: alloc.invoiceId } })
                if (!invoice) throw new Error(`Invoice ID ${alloc.invoiceId} not found`)

                if (alloc.amountApplied > invoice.balanceDue + 0.01) {
                    throw new Error(`Cannot over-pay invoice ${invoice.invoiceNumber}`)
                }

                // 1. Create the Payment Voucher link for this specific invoice
                const payment = await tx.payment.create({
                    data: {
                        paymentType: "OUT",
                        partyId: data.partyId,
                        purchaseInvoiceId: invoice.id,
                        paymentDate: data.paymentDate,
                        totalAmount: alloc.amountApplied,
                        notes: data.notes || `Paid against ${invoice.invoiceNumber}`,
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
                            data: { currentBalance: { decrement: modeShare } }
                        })
                    }
                }

                // 3. Update Invoice Balances
                const newAmountPaid = invoice.amountPaid + alloc.amountApplied
                const newBalanceDue = Math.max(0, invoice.grandTotal - newAmountPaid)
                const newStatus = newBalanceDue <= 0.01 ? "paid" : "partial"

                await tx.purchaseInvoice.update({
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
        revalidatePath("/dashboard/purchases")
        return { success: true, data: result }
    } catch (error: any) {
        console.error("Error creating payment out:", error)
        return { success: false, error: error.message || "Failed to record payment" }
    }
}
