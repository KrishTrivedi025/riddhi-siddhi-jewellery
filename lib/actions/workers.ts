"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { format, eachDayOfInterval } from "date-fns"
import { requireUserId } from "./auth-helper"
import { currentMonthStart, monthStartUTC, monthEndUTC, todayIST } from "../date-utils"
import type { WorkerRateFormValues } from "../schemas/worker-schema"
import type {
    SupplierPaymentMode,
    SupplierLedgerEntryType,
    SupplierTransactionWithBalance,
} from "./supplier-transactions"

export type WorkerDayStatus = "ABSENT" | "HALF_DAY"

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
    halfDays: number
    netBalance: number
    month: string // "yyyy-MM"
    dayStatus: Record<string, WorkerDayStatus> // "yyyy-MM-dd" -> status; absent from here = present
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
        // Last day of the month, at UTC midnight — eachDayOfInterval below walks whole
        // calendar days, not the 23:59:59.999 end-of-day monthEnd used for DB range queries.
        const monthEndMidnight = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0))
        const lastElapsedDay = new Date(Math.min(todayIST().getTime(), monthEndMidnight.getTime()))

        const rate = await getWorkerRate(partyId, monthStart)
        const monthlySalary = rate?.monthlySalary ?? 0
        const dailyDeduction = rate?.dailyDeduction ?? 0

        const rows = await prisma.supplierTransaction.findMany({
            where: { userId, partyId, deletedAt: null, date: { gte: monthStart, lte: monthEnd } },
            orderBy: [{ date: "asc" }, { createdAt: "asc" }],
            include: { attachments: true },
        })

        // Attendance status per date, from ABSENT/HALF_DAY rows. A date with no entry
        // here is present (the default) — see setWorkerAttendance.
        const dayStatusMap = new Map<string, WorkerDayStatus>()
        const rowsByDate = new Map<string, typeof rows>()
        for (const t of rows) {
            const key = format(t.date, "yyyy-MM-dd")
            if (t.type === "ABSENT" || t.type === "HALF_DAY") dayStatusMap.set(key, t.type)
            const list = rowsByDate.get(key)
            if (list) list.push(t)
            else rowsByDate.set(key, [t])
        }

        // Walk the month day by day: the balance starts at 0 and, for each day that has
        // already elapsed, grows by a full day's pay (present, the default), half a day's
        // pay (HALF_DAY), or nothing (ABSENT). That day's own GAVE/GOT/ABSENT/HALF_DAY rows
        // are then applied in the same pass, so every row's running balance already
        // includes every earlier day's accrual — not just the earlier rows' amounts.
        let runningBalance = 0
        const balanceByRowId = new Map<string, number>()
        const allDays = eachDayOfInterval({ start: monthStart, end: monthEndMidnight })
        for (const day of allDays) {
            const dateStr = format(day, "yyyy-MM-dd")
            if (day.getTime() <= lastElapsedDay.getTime()) {
                const status = dayStatusMap.get(dateStr)
                const dayPay = status === "ABSENT" ? 0 : status === "HALF_DAY" ? dailyDeduction / 2 : dailyDeduction
                runningBalance -= dayPay
            }
            const dayRows = (rowsByDate.get(dateStr) ?? []).slice().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            for (const t of dayRows) {
                if (t.type === "GAVE") runningBalance += t.amount
                else if (t.type === "GOT") runningBalance -= t.amount
                // ABSENT/HALF_DAY's own effect is the dayPay accrual above — don't double-apply.
                balanceByRowId.set(t.id, runningBalance)
            }
        }

        const transactions: SupplierTransactionWithBalance[] = rows.map((t) => {
            const type = t.type as SupplierLedgerEntryType
            return {
                id: t.id,
                type,
                amount: t.amount,
                details: t.details,
                date: t.date,
                createdAt: t.createdAt,
                paymentMode: t.paymentMode as SupplierPaymentMode | null,
                runningBalance: balanceByRowId.get(t.id) ?? runningBalance,
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
        const halfDayEntries = transactions.filter((t) => t.type === "HALF_DAY")
        const totalAbsentDeduction = absentEntries.reduce((s, t) => s + t.amount, 0)

        const dayStatus: Record<string, WorkerDayStatus> = {}
        for (const [date, status] of dayStatusMap) dayStatus[date] = status

        return {
            transactions: [...transactions].reverse(), // newest first, matching getSupplierTransactions
            summary: {
                monthlySalary,
                dailyDeduction,
                totalGave,
                totalGot,
                totalAbsentDeduction,
                absentDays: absentEntries.length,
                halfDays: halfDayEntries.length,
                netBalance: runningBalance,
                month: format(monthStart, "yyyy-MM"),
                dayStatus,
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
//
// dayStatus is the full desired ABSENT/HALF_DAY map for the month (a date missing from
// it is present) — called with the whole map on every single-day tap, same diff-against-
// existing-rows approach as before, just generalized from a plain absent/present toggle
// to the three-state ABSENT/HALF_DAY/present one.
export async function setWorkerAttendance(partyId: string, dayStatus: Record<string, WorkerDayStatus>) {
    try {
        const userId = await requireUserId()
        const monthStart = currentMonthStart()
        const monthEnd = monthEndUTC(monthStart)

        const rate = await getWorkerRate(partyId, monthStart)
        if (!rate) return { success: false, error: "No salary rate set for this worker" }

        const existing = await prisma.supplierTransaction.findMany({
            where: {
                userId,
                partyId,
                type: { in: ["ABSENT", "HALF_DAY"] },
                deletedAt: null,
                date: { gte: monthStart, lte: monthEnd },
            },
        })
        const existingByDate = new Map(existing.map((t) => [format(t.date, "yyyy-MM-dd"), t]))
        const desired = new Map(Object.entries(dayStatus))

        const toCreate = [...desired].filter(([d]) => !existingByDate.has(d))
        const toUpdate = [...desired].filter(([d, status]) => existingByDate.get(d)?.type !== undefined && existingByDate.get(d)!.type !== status)
        const toDelete = existing.filter((t) => !desired.has(format(t.date, "yyyy-MM-dd")))

        if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
            return { success: true }
        }

        const amountFor = (status: WorkerDayStatus) => (status === "HALF_DAY" ? rate.dailyDeduction / 2 : rate.dailyDeduction)
        const detailsFor = (status: WorkerDayStatus) => (status === "HALF_DAY" ? "Half Day" : "Absent")

        await prisma.$transaction([
            ...toCreate.map(([d, status]) =>
                prisma.supplierTransaction.create({
                    data: {
                        userId,
                        partyId,
                        type: status,
                        amount: amountFor(status),
                        details: detailsFor(status),
                        date: new Date(d),
                    },
                })
            ),
            ...toUpdate.map(([d, status]) =>
                prisma.supplierTransaction.update({
                    where: { id: existingByDate.get(d)!.id },
                    data: { type: status, amount: amountFor(status), details: detailsFor(status) },
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
