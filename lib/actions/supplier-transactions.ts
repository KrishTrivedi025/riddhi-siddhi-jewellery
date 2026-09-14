"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireUserId } from "./auth-helper"
import type { QuickSupplierFormValues, SupplierTransactionFormValues } from "../schemas/supplier-transaction-schema"

export type SupplierTransactionType = "GAVE" | "GOT"

export interface SupplierKhataSummaryItem {
    id: string
    name: string
    phone: string | null
    netBalance: number // positive = you will get, negative = you will give
    lastActivity: Date | null
}

export interface SupplierKhataSummary {
    suppliers: SupplierKhataSummaryItem[]
    totalWillGive: number
    totalWillGet: number
}

export async function getSupplierKhataSummary(): Promise<SupplierKhataSummary> {
    try {
        const userId = await requireUserId()
        const suppliers = await prisma.party.findMany({
            where: { userId, partyType: "SUPPLIER", deletedAt: null },
            orderBy: { name: "asc" },
        })

        if (suppliers.length === 0) {
            return { suppliers: [], totalWillGive: 0, totalWillGet: 0 }
        }

        const partyIds = suppliers.map((s) => s.id)

        const sums = await prisma.supplierTransaction.groupBy({
            by: ["partyId", "type"],
            where: { userId, deletedAt: null, partyId: { in: partyIds } },
            _sum: { amount: true },
        })

        const lastActivity = await prisma.supplierTransaction.groupBy({
            by: ["partyId"],
            where: { userId, deletedAt: null, partyId: { in: partyIds } },
            _max: { createdAt: true },
        })

        const balanceMap = new Map<string, { gave: number; got: number }>()
        for (const s of sums) {
            const entry = balanceMap.get(s.partyId) || { gave: 0, got: 0 }
            if (s.type === "GAVE") entry.gave = s._sum.amount || 0
            else entry.got = s._sum.amount || 0
            balanceMap.set(s.partyId, entry)
        }

        const lastActivityMap = new Map<string, Date>()
        for (const l of lastActivity) {
            if (l._max.createdAt) lastActivityMap.set(l.partyId, l._max.createdAt)
        }

        let totalWillGive = 0
        let totalWillGet = 0

        const items: SupplierKhataSummaryItem[] = suppliers.map((supplier) => {
            const { gave, got } = balanceMap.get(supplier.id) || { gave: 0, got: 0 }
            const netBalance = gave - got
            if (netBalance > 0) totalWillGet += netBalance
            else if (netBalance < 0) totalWillGive += Math.abs(netBalance)

            return {
                id: supplier.id,
                name: supplier.name,
                phone: supplier.phone,
                netBalance,
                lastActivity: lastActivityMap.get(supplier.id) || null,
            }
        })

        return { suppliers: items, totalWillGive, totalWillGet }
    } catch (error) {
        console.error("Error fetching supplier khata summary:", error)
        throw new Error("Failed to fetch supplier khata summary")
    }
}

export interface SupplierTransactionAttachmentOut {
    id: string
    url: string
    fileName: string
    fileType: string
}

export interface SupplierTransactionWithBalance {
    id: string
    type: SupplierTransactionType
    amount: number
    details: string | null
    date: Date
    createdAt: Date
    runningBalance: number
    attachments: SupplierTransactionAttachmentOut[]
}

export interface SupplierTransactionFilters {
    fromDate?: Date
    toDate?: Date
    search?: string
}

export interface SupplierTransactionsResult {
    transactions: SupplierTransactionWithBalance[]
    summary: {
        totalGave: number
        totalGot: number
        netBalance: number
        entryCount: number
    }
}

export async function getSupplierTransactions(
    partyId: string,
    filters?: SupplierTransactionFilters
): Promise<SupplierTransactionsResult> {
    try {
        const userId = await requireUserId()

        // Fetch the full unfiltered chronological history first — a date/search filter
        // must narrow which rows are *shown*, not change the running balance of the rows
        // that remain (those balances depend on everything that came before them).
        const all = await prisma.supplierTransaction.findMany({
            where: { userId, partyId, deletedAt: null },
            orderBy: [{ date: "asc" }, { createdAt: "asc" }],
            include: { attachments: true },
        })

        let runningBalance = 0
        const withBalance: SupplierTransactionWithBalance[] = all.map((t) => {
            runningBalance += t.type === "GAVE" ? t.amount : -t.amount
            return {
                id: t.id,
                type: t.type as SupplierTransactionType,
                amount: t.amount,
                details: t.details,
                date: t.date,
                createdAt: t.createdAt,
                runningBalance,
                attachments: t.attachments.map((a) => ({
                    id: a.id,
                    url: a.url,
                    fileName: a.fileName,
                    fileType: a.fileType,
                })),
            }
        })

        let filtered = withBalance
        if (filters?.fromDate) {
            const from = filters.fromDate
            filtered = filtered.filter((t) => t.date >= from)
        }
        if (filters?.toDate) {
            const end = new Date(filters.toDate)
            end.setHours(23, 59, 59, 999)
            filtered = filtered.filter((t) => t.date <= end)
        }
        if (filters?.search) {
            const q = filters.search.toLowerCase()
            filtered = filtered.filter(
                (t) => (t.details || "").toLowerCase().includes(q) || String(t.amount).includes(q)
            )
        }

        const totalGave = filtered.reduce((s, t) => s + (t.type === "GAVE" ? t.amount : 0), 0)
        const totalGot = filtered.reduce((s, t) => s + (t.type === "GOT" ? t.amount : 0), 0)

        return {
            transactions: [...filtered].reverse(), // newest first for display
            summary: {
                totalGave,
                totalGot,
                netBalance: totalGave - totalGot,
                entryCount: filtered.length,
            },
        }
    } catch (error) {
        console.error("Error fetching supplier transactions:", error)
        throw new Error("Failed to fetch supplier transactions")
    }
}

export async function createSupplierTransaction(data: SupplierTransactionFormValues) {
    try {
        const userId = await requireUserId()
        const transaction = await prisma.supplierTransaction.create({
            data: {
                userId,
                partyId: data.partyId,
                type: data.type,
                amount: data.amount,
                details: data.details || null,
                date: data.date,
                attachments: {
                    create: data.attachments.map((a) => ({
                        url: a.url,
                        fileName: a.fileName,
                        fileType: a.fileType,
                    })),
                },
            },
            include: { attachments: true },
        })
        revalidatePath("/dashboard/parties")
        revalidatePath(`/dashboard/parties/${data.partyId}`)
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Error creating supplier transaction:", error)
        return { success: false, error: "Failed to save transaction" }
    }
}

export async function updateSupplierTransaction(id: string, data: SupplierTransactionFormValues) {
    try {
        const userId = await requireUserId()
        const existing = await prisma.supplierTransaction.findFirst({ where: { id, userId } })
        if (!existing) return { success: false, error: "Transaction not found" }

        const transaction = await prisma.$transaction(async (tx) => {
            await tx.supplierTransactionAttachment.deleteMany({ where: { transactionId: id } })
            return tx.supplierTransaction.update({
                where: { id },
                data: {
                    type: data.type,
                    amount: data.amount,
                    details: data.details || null,
                    date: data.date,
                    attachments: {
                        create: data.attachments.map((a) => ({
                            url: a.url,
                            fileName: a.fileName,
                            fileType: a.fileType,
                        })),
                    },
                },
                include: { attachments: true },
            })
        })

        revalidatePath("/dashboard/parties")
        revalidatePath(`/dashboard/parties/${existing.partyId}`)
        return { success: true, data: transaction }
    } catch (error) {
        console.error("Error updating supplier transaction:", error)
        return { success: false, error: "Failed to update transaction" }
    }
}

export async function deleteSupplierTransaction(id: string) {
    try {
        const userId = await requireUserId()
        const existing = await prisma.supplierTransaction.findFirst({ where: { id, userId } })
        if (!existing) return { success: false, error: "Transaction not found" }

        await prisma.supplierTransaction.update({
            where: { id },
            data: { deletedAt: new Date() },
        })
        revalidatePath("/dashboard/parties")
        revalidatePath(`/dashboard/parties/${existing.partyId}`)
        return { success: true }
    } catch (error) {
        console.error("Error deleting supplier transaction:", error)
        return { success: false, error: "Failed to delete transaction" }
    }
}

export interface AllSupplierTransactionRow {
    id: string
    partyId: string
    partyName: string
    type: SupplierTransactionType
    amount: number
    details: string | null
    date: Date
    createdAt: Date
}

// Unfiltered — the report UI filters by date range/search client-side against this single fetch,
// same pattern as getSupplierTransactions, to avoid a server round-trip per filter change.
export async function getAllSupplierTransactions(): Promise<AllSupplierTransactionRow[]> {
    try {
        const userId = await requireUserId()
        const rows = await prisma.supplierTransaction.findMany({
            where: { userId, deletedAt: null, party: { deletedAt: null } },
            include: { party: { select: { name: true } } },
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        })
        return rows.map((t) => ({
            id: t.id,
            partyId: t.partyId,
            partyName: t.party.name,
            type: t.type as SupplierTransactionType,
            amount: t.amount,
            details: t.details,
            date: t.date,
            createdAt: t.createdAt,
        }))
    } catch (error) {
        console.error("Error fetching all supplier transactions:", error)
        throw new Error("Failed to fetch supplier transactions")
    }
}

export async function createQuickSupplier(data: QuickSupplierFormValues) {
    try {
        const userId = await requireUserId()
        const party = await prisma.party.create({
            data: {
                userId,
                partyType: "SUPPLIER",
                name: data.name,
                phone: data.phone || null,
            },
        })
        revalidatePath("/dashboard/parties")
        return { success: true, data: party }
    } catch (error) {
        console.error("Error creating supplier:", error)
        return { success: false, error: "Failed to create supplier" }
    }
}
