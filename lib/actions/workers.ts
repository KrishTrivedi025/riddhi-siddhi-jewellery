"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { requireUserId } from "./auth-helper"
import { currentMonthStart, monthStartUTC, monthEndUTC } from "../date-utils"
import type { WorkerRateFormValues } from "../schemas/worker-schema"
import type {
    SupplierPaymentMode,
    SupplierLedgerEntryType,
    SupplierTransactionWithBalance,
} from "./supplier-transactions"

export interface WorkerRateInfo {
    monthlySalary: number
    dailyDeduction: number
    effectiveFrom: Date
}

export async function getWorkerRate(partyId: string, month?: Date): Promise<WorkerRateInfo | null> {
    try {
        const userId = await requireUserId()
        const monthStart = month ? monthStartUTC(month) : currentMonthStart()
        const rate = await prisma.workerRate.findFirst({
            where: { userId, partyId, effectiveFrom: { lte: monthStart } },
            orderBy: { effectiveFrom: "desc" },
        })
        if (!rate) return null
        return {
            monthlySalary: rate.monthlySalary,
            dailyDeduction: rate.dailyDeduction,
            effectiveFrom: rate.effectiveFrom,
        }
    } catch (error) {
        console.error("Error fetching worker rate:", error)
        throw new Error("Failed to fetch worker rate")
    }
}

export async function setWorkerRate(partyId: string, data: WorkerRateFormValues) {
    try {
        const userId = await requireUserId()
        // A rate edit applies from the current month onward only — past months keep
        // showing whatever rate was in effect then. Upserting on (partyId, thisMonth)
        // is what makes "future months only" actually mean "current month onward":
        // editing again within the same month updates in place instead of stacking rows.
        const monthStart = currentMonthStart()
        const existing = await prisma.workerRate.findFirst({
            where: { userId, partyId, effectiveFrom: monthStart },
        })
        if (existing) {
            await prisma.workerRate.update({
                where: { id: existing.id },
                data: { monthlySalary: data.monthlySalary, dailyDeduction: data.dailyDeduction },
            })
        } else {
            await prisma.workerRate.create({
                data: {
                    userId,
                    partyId,
                    monthlySalary: data.monthlySalary,
                    dailyDeduction: data.dailyDeduction,
                    effectiveFrom: monthStart,
                },
            })
        }
        revalidatePath("/dashboard/parties")
        revalidatePath(`/dashboard/parties/${partyId}`)
        return { success: true }
    } catch (error) {
        console.error("Error setting worker rate:", error)
        return { success: false, error: "Failed to update rate" }
    }
}

export interface WorkerLedgerSummary {
    monthlySalary: number
    dailyDeduction: number
    totalGave: number
    totalGot: number
    totalAbsentDeduction: number
    absentDays: number
    netBalance: number
    month: string // "yyyy-MM"
    absentDates: string[] // "yyyy-MM-dd"
}

export interface WorkerLedgerResult {
    transactions: SupplierTransactionWithBalance[]
    summary: WorkerLedgerSummary
}

export async function getWorkerLedger(partyId: string, month?: Date): Promise<WorkerLedgerResult> {
    try {
        const userId = await requireUserId()
        const monthStart = month ? monthStartUTC(month) : currentMonthStart()
        const monthEnd = monthEndUTC(monthStart)

        const rate = await getWorkerRate(partyId, monthStart)
        const monthlySalary = rate?.monthlySalary ?? 0
        const dailyDeduction = rate?.dailyDeduction ?? 0

        const rows = await prisma.supplierTransaction.findMany({
            where: { userId, partyId, deletedAt: null, date: { gte: monthStart, lte: monthEnd } },
            orderBy: [{ date: "asc" }, { createdAt: "asc" }],
            include: { attachments: true },
        })

        // Opening balance is -monthlySalary (you owe the worker their full salary for
        // the month). GAVE (an ad-hoc payment) and ABSENT (a deduction) both reduce that
        // debt the same way; GOT increases it — mirrors the plain GAVE/GOT convention
        // but starting from -salary instead of 0, since the ledger resets every month.
        let runningBalance = -monthlySalary
        const transactions: SupplierTransactionWithBalance[] = rows.map((t) => {
            const type = t.type as SupplierLedgerEntryType
            runningBalance += type === "GOT" ? -t.amount : t.amount
            return {
                id: t.id,
                type,
                amount: t.amount,
                details: t.details,
                date: t.date,
                createdAt: t.createdAt,
                paymentMode: t.paymentMode as SupplierPaymentMode | null,
                runningBalance,
                attachments: t.attachments.map((a) => ({
                    id: a.id,
                    url: a.url,
                    fileName: a.fileName,
                    fileType: a.fileType,
                })),
            }
        })

        const totalGave = transactions.reduce((s, t) => s + (t.type === "GAVE" ? t.amount : 0), 0)
        const totalGot = transactions.reduce((s, t) => s + (t.type === "GOT" ? t.amount : 0), 0)
        const absentEntries = transactions.filter((t) => t.type === "ABSENT")
        const totalAbsentDeduction = absentEntries.reduce((s, t) => s + t.amount, 0)
        const netBalance = -monthlySalary + totalGave + totalAbsentDeduction - totalGot

        return {
            transactions: [...transactions].reverse(), // newest first, matching getSupplierTransactions
            summary: {
                monthlySalary,
                dailyDeduction,
                totalGave,
                totalGot,
                totalAbsentDeduction,
                absentDays: absentEntries.length,
                netBalance,
                month: format(monthStart, "yyyy-MM"),
                absentDates: absentEntries.map((t) => format(t.date, "yyyy-MM-dd")),
            },
        }
    } catch (error) {
        console.error("Error fetching worker ledger:", error)
        throw new Error("Failed to fetch worker ledger")
    }
}

// Always targets the current month — the attendance calendar only ever shows and
// edits the current month, so "the month" is resolved here server-side rather than
// trusted from the caller (a client-computed Date would carry the same IST/UTC
// mismatch described in lib/date-utils.ts).
export async function setWorkerAttendance(partyId: string, absentDates: string[]) {
    try {
        const userId = await requireUserId()
        const monthStart = currentMonthStart()
        const monthEnd = monthEndUTC(monthStart)

        const rate = await getWorkerRate(partyId, monthStart)
        if (!rate) return { success: false, error: "No salary rate set for this worker" }

        const existing = await prisma.supplierTransaction.findMany({
            where: { userId, partyId, type: "ABSENT", deletedAt: null, date: { gte: monthStart, lte: monthEnd } },
        })
        const existingByDate = new Map(existing.map((t) => [format(t.date, "yyyy-MM-dd"), t]))

        const desired = new Set(absentDates)
        const toCreate = absentDates.filter((d) => !existingByDate.has(d))
        const toDelete = existing.filter((t) => !desired.has(format(t.date, "yyyy-MM-dd")))

        if (toCreate.length === 0 && toDelete.length === 0) {
            return { success: true }
        }

        await prisma.$transaction([
            ...toCreate.map((d) =>
                prisma.supplierTransaction.create({
                    data: {
                        userId,
                        partyId,
                        type: "ABSENT",
                        amount: rate.dailyDeduction,
                        details: "Absent",
                        date: new Date(d),
                    },
                })
            ),
            ...toDelete.map((t) =>
                prisma.supplierTransaction.update({
                    where: { id: t.id },
                    data: { deletedAt: new Date() },
                })
            ),
        ])

        revalidatePath("/dashboard/parties")
        revalidatePath(`/dashboard/parties/${partyId}`)
        return { success: true }
    } catch (error) {
        console.error("Error saving worker attendance:", error)
        return { success: false, error: "Failed to save attendance" }
    }
}
