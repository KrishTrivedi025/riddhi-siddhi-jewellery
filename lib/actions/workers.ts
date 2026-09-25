"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { format, eachDayOfInterval, getDaysInMonth } from "date-fns"
import { requireUserId } from "./auth-helper"
import { currentMonthStart, monthStartUTC, monthEndUTC, monthKeyToUTC, todayIST, type MonthKey } from "../date-utils"
import { dailyRateForMonth, halfDayAmount } from "../worker-utils"
import type { WorkerRateFormValues } from "../schemas/worker-schema"
import type {
    SupplierPaymentMode,
    SupplierLedgerEntryType,
    SupplierTransactionWithBalance,
} from "./supplier-transactions"

export type WorkerDayStatus = "ABSENT" | "HALF_DAY"
export type { MonthKey } from "../date-utils"

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
            // Always derived from monthlySalary + this month's day count — never the
            // stored WorkerRate.dailyDeduction column, which only exists to satisfy the
            // (legacy) NOT NULL constraint. See dailyRateForMonth.
            dailyDeduction: dailyRateForMonth(rate.monthlySalary, monthStart),
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
        // dailyDeduction is written here only to satisfy the DB column; every real read
        // (getWorkerRate) recomputes it per month instead of trusting this value.
        const dailyDeduction = dailyRateForMonth(data.monthlySalary, monthStart)
        const existing = await prisma.workerRate.findFirst({
            where: { userId, partyId, effectiveFrom: monthStart },
        })
        if (existing) {
            await prisma.workerRate.update({
                where: { id: existing.id },
                data: { monthlySalary: data.monthlySalary, dailyDeduction },
            })
        } else {
            await prisma.workerRate.create({
                data: {
                    userId,
                    partyId,
                    monthlySalary: data.monthlySalary,
                    dailyDeduction,
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
    openingBalance: number // carried forward from every earlier month, negative = owed
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

// Folds every fully-elapsed month from the worker's first WorkerRate up to (but not
// including) targetMonthStart into a single balance — this becomes targetMonthStart's
// opening balance, so "12,000 still owed at the end of August" carries into September
// instead of September resetting to 0. One rates query + one transactions query cover
// the whole span, then the fold happens in memory (each month needs its own day count
// and its own effective rate, so it can't be reduced to a single groupBy).
export async function getWorkerCarriedBalance(userId: string, partyId: string, targetMonthStart: Date): Promise<number> {
    // The fold has to start at whichever came first — the worker's first rate, or their
    // first transaction. A worker can have manually-recorded GAVE/GOT entries (e.g. an
    // owed-salary balance entered by hand) dated *before* any WorkerRate ever existed for
    // them; starting only from the rate's month would silently skip those real entries.
    const [earliestRate, earliestTxn] = await Promise.all([
        prisma.workerRate.findFirst({ where: { userId, partyId }, orderBy: { effectiveFrom: "asc" } }),
        prisma.supplierTransaction.findFirst({
            where: { userId, partyId, deletedAt: null, date: { lt: targetMonthStart } },
            orderBy: { date: "asc" },
        }),
    ])
    if (!earliestRate && !earliestTxn) return 0
    const candidates = [
        earliestRate ? monthStartUTC(earliestRate.effectiveFrom).getTime() : null,
        earliestTxn ? monthStartUTC(earliestTxn.date).getTime() : null,
    ].filter((t): t is number => t !== null)
    const startMonth = new Date(Math.min(...candidates))
    if (startMonth.getTime() >= targetMonthStart.getTime()) return 0

    const rates = await prisma.workerRate.findMany({
        where: { userId, partyId, effectiveFrom: { lt: targetMonthStart } },
        orderBy: { effectiveFrom: "asc" },
    })
    const rows = await prisma.supplierTransaction.findMany({
        where: { userId, partyId, deletedAt: null, date: { gte: startMonth, lt: targetMonthStart } },
        select: { type: true, amount: true, date: true },
    })

    let balance = 0
    let cursor = startMonth
    while (cursor.getTime() < targetMonthStart.getTime()) {
        const cursorEnd = monthEndUTC(cursor)
        const rateForMonth = rates.filter((r) => r.effectiveFrom.getTime() <= cursor.getTime()).pop()
        const dailyDeduction = rateForMonth ? dailyRateForMonth(rateForMonth.monthlySalary, cursor) : 0
        const daysInMonth = getDaysInMonth(cursor)

        let absentDays = 0
        let halfDays = 0
        let gave = 0
        let got = 0
        for (const t of rows) {
            if (t.date < cursor || t.date > cursorEnd) continue
            if (t.type === "ABSENT") absentDays++
            else if (t.type === "HALF_DAY") halfDays++
            else if (t.type === "GAVE") gave += t.amount
            else if (t.type === "GOT") got += t.amount
        }
        const presentDays = Math.max(0, daysInMonth - absentDays - halfDays)
        const accrued = presentDays * dailyDeduction + halfDays * halfDayAmount(dailyDeduction)
        balance = Math.round(balance - accrued + gave - got)

        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
    }
    return balance
}

export async function getWorkerLedger(partyId: string, monthKey?: MonthKey): Promise<WorkerLedgerResult> {
    try {
        const userId = await requireUserId()
        const monthStart = monthKey ? monthKeyToUTC(monthKey) : currentMonthStart()
        const monthEnd = monthEndUTC(monthStart)
        // Last day of the month, at UTC midnight — eachDayOfInterval below walks whole
        // calendar days, not the 23:59:59.999 end-of-day monthEnd used for DB range queries.
        const monthEndMidnight = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0))
        const lastElapsedDay = new Date(Math.min(todayIST().getTime(), monthEndMidnight.getTime()))

        const rate = await getWorkerRate(partyId, monthStart)
        const monthlySalary = rate?.monthlySalary ?? 0
        const dailyDeduction = rate?.dailyDeduction ?? 0
        const openingBalance = await getWorkerCarriedBalance(userId, partyId, monthStart)

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

        // Walk the month day by day: the balance starts at the carried-forward opening
        // balance (not 0 — see getWorkerCarriedBalance) and, for each day that has already
        // elapsed, grows by a full day's pay (present, the default), half a day's pay
        // (HALF_DAY), or nothing (ABSENT). That day's own GAVE/GOT/ABSENT/HALF_DAY rows are
        // then applied in the same pass, so every row's running balance already includes
        // every earlier day's accrual — not just the earlier rows' amounts.
        let runningBalance = openingBalance
        const balanceByRowId = new Map<string, number>()
        const allDays = eachDayOfInterval({ start: monthStart, end: monthEndMidnight })
        for (const day of allDays) {
            const dateStr = format(day, "yyyy-MM-dd")
            if (day.getTime() <= lastElapsedDay.getTime()) {
                const status = dayStatusMap.get(dateStr)
                const dayPay = status === "ABSENT" ? 0 : status === "HALF_DAY" ? halfDayAmount(dailyDeduction) : dailyDeduction
                runningBalance = Math.round(runningBalance - dayPay)
            }
            const dayRows = (rowsByDate.get(dateStr) ?? []).slice().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            for (const t of dayRows) {
                if (t.type === "GAVE") runningBalance = Math.round(runningBalance + t.amount)
                else if (t.type === "GOT") runningBalance = Math.round(runningBalance - t.amount)
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

        // A visible "Opening Balance" line on the 1st of the month, carrying forward
        // whatever was still owed at the end of the previous month — not a real DB row
        // (can't be edited or deleted), so it's synthesized here rather than stored.
        // Placed first in this still-chronological array so it lands last (oldest) after
        // the newest-first reverse below.
        if (openingBalance !== 0) {
            transactions.unshift({
                id: "opening-balance",
                type: "OPENING",
                amount: Math.abs(openingBalance),
                details: "Opening Balance",
                date: monthStart,
                createdAt: monthStart,
                paymentMode: null,
                runningBalance: openingBalance,
                attachments: [],
            })
        }

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
                openingBalance,
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

// The calendar is now navigable to past months (see worker-attendance-calendar.tsx), so
// month is whichever month is on screen — passed as a MonthKey (plain {year, month}, no
// Date) rather than trusted as a client Date, since a Date built from date-fns's *local*
// startOfMonth/addMonths/subMonths reads back wrong here on an IST client — see MonthKey
// in lib/date-utils.ts for the full explanation.
//
// dayStatus is the full desired ABSENT/HALF_DAY map for that month (a date missing from
// it is present) — called with the whole map on every single-day tap, same diff-against-
// existing-rows approach as before, just generalized from a plain absent/present toggle
// to the three-state ABSENT/HALF_DAY/present one.
export async function setWorkerAttendance(partyId: string, monthKey: MonthKey, dayStatus: Record<string, WorkerDayStatus>) {
    try {
        const userId = await requireUserId()
        const monthStart = monthKeyToUTC(monthKey)
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

        const amountFor = (status: WorkerDayStatus) => (status === "HALF_DAY" ? halfDayAmount(rate.dailyDeduction) : rate.dailyDeduction)
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
