"use server"

import { prisma } from "@/lib/db"
import { requireUserId } from "./auth-helper"
import {
    startOfMonth, endOfMonth,
    subMonths, eachMonthOfInterval, format, isWithinInterval,
} from "date-fns"

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface DateRange { from: Date; to: Date }

function dateWhere(field: string, range: DateRange) {
    return { [field]: { gte: range.from, lte: range.to } }
}

// ─── 1. Profit & Loss Report ──────────────────────────────────────────────────

export async function getProfitLossReport(range: DateRange) {
    const userId = await requireUserId()
    const sales = await prisma.saleInvoice.findMany({
        where: { userId, deletedAt: null, status: "active", ...dateWhere("invoiceDate", range) },
        select: { grandTotal: true, totalDiscount: true, cgst: true, sgst: true, igst: true, invoiceDate: true },
    })
    const purchases = await prisma.purchaseInvoice.findMany({
        where: { userId, deletedAt: null, status: "active", ...dateWhere("invoiceDate", range) },
        select: { grandTotal: true, cgst: true, sgst: true, igst: true, invoiceDate: true },
    })
    const expenses = await prisma.expense.findMany({
        where: { userId, deletedAt: null, ...dateWhere("expenseDate", range) },
        select: { amount: true, gstAmount: true, category: true, expenseDate: true },
    })

    const totalRevenue   = sales.reduce((s, i) => s + i.grandTotal, 0)
    const totalCOGS      = purchases.reduce((s, i) => s + i.grandTotal, 0)
    const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0)
    const totalGstOut    = sales.reduce((s, i) => s + i.cgst + i.sgst + i.igst, 0)
    const totalGstIn     = purchases.reduce((s, i) => s + i.cgst + i.sgst + i.igst, 0)
    const expenseGstITC  = expenses.reduce((s, e) => s + e.gstAmount, 0)
    const netProfit      = totalRevenue - totalCOGS - totalExpenses

    // Monthly breakdown for trend chart
    const months = eachMonthOfInterval({ start: range.from, end: range.to })
    const monthly = months.map(m => {
        const ms = startOfMonth(m), me = endOfMonth(m)
        const inRange = (d: Date) => isWithinInterval(d, { start: ms, end: me })
        const rev  = sales.filter(s => inRange(s.invoiceDate)).reduce((a, s) => a + s.grandTotal, 0)
        const cost = purchases.filter(p => inRange(p.invoiceDate)).reduce((a, p) => a + p.grandTotal, 0)
        const exp  = expenses.filter(e => inRange(e.expenseDate)).reduce((a, e) => a + e.amount, 0)
        return { month: format(m, "MMM yy"), revenue: rev, cost, expenses: exp, profit: rev - cost - exp }
    })

    // Expense by category
    const expByCategory: Record<string, number> = {}
    for (const e of expenses) expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount
    const expenseBreakdown = Object.entries(expByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    return {
        totalRevenue, totalCOGS, totalExpenses, netProfit,
        totalGstOut, totalGstIn, expenseGstITC,
        grossProfit: totalRevenue - totalCOGS,
        monthly, expenseBreakdown,
    }
}

// ─── 2. Sales Report ──────────────────────────────────────────────────────────

export async function getSalesReport(range: DateRange) {
    const userId = await requireUserId()
    const invoices = await prisma.saleInvoice.findMany({
        where: { userId, deletedAt: null, status: "active", ...dateWhere("invoiceDate", range) },
        include: { party: { select: { id: true, name: true } }, items: { select: { itemName: true, quantity: true, amount: true } } },
        orderBy: { invoiceDate: "desc" },
    })
    const totals = invoices.reduce(
        (acc, inv) => ({
            grandTotal:    acc.grandTotal + inv.grandTotal,
            taxableAmount: acc.taxableAmount + inv.taxableAmount,
            cgst:          acc.cgst + inv.cgst,
            sgst:          acc.sgst + inv.sgst,
            igst:          acc.igst + inv.igst,
            totalDiscount: acc.totalDiscount + inv.totalDiscount,
            amountPaid:    acc.amountPaid + inv.amountPaid,
            balanceDue:    acc.balanceDue + inv.balanceDue,
        }),
        { grandTotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalDiscount: 0, amountPaid: 0, balanceDue: 0 }
    )
    return { invoices, totals }
}

// ─── 3. Purchase Report ───────────────────────────────────────────────────────

export async function getPurchaseReport(range: DateRange) {
    const userId = await requireUserId()
    const invoices = await prisma.purchaseInvoice.findMany({
        where: { userId, deletedAt: null, status: "active", ...dateWhere("invoiceDate", range) },
        include: { party: { select: { id: true, name: true } }, items: { select: { itemName: true, quantity: true, amount: true } } },
        orderBy: { invoiceDate: "desc" },
    })
    const totals = invoices.reduce(
        (acc, inv) => ({
            grandTotal:    acc.grandTotal + inv.grandTotal,
            taxableAmount: acc.taxableAmount + inv.taxableAmount,
            cgst:          acc.cgst + inv.cgst,
            sgst:          acc.sgst + inv.sgst,
            igst:          acc.igst + inv.igst,
            totalDiscount: acc.totalDiscount + inv.totalDiscount,
            amountPaid:    acc.amountPaid + inv.amountPaid,
            balanceDue:    acc.balanceDue + inv.balanceDue,
        }),
        { grandTotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalDiscount: 0, amountPaid: 0, balanceDue: 0 }
    )
    return { invoices, totals }
}

// ─── 4. Outstanding Receivable Report ────────────────────────────────────────

export async function getOutstandingReceivableReport() {
    const userId = await requireUserId()
    const invoices = await prisma.saleInvoice.findMany({
        where: { userId, deletedAt: null, status: "active", paymentStatus: { in: ["unpaid", "partial"] }, balanceDue: { gt: 0 } },
        include: { party: { select: { id: true, name: true } } },
        orderBy: { invoiceDate: "asc" },
    })
    const now = new Date()
    const buckets = { b0: 0, b30: 0, b60: 0, b90: 0 }
    type PartyRow = { id: string; name: string; total: number; b0: number; b30: number; b60: number; b90: number }
    const partyMap: Record<string, PartyRow> = {}

    for (const inv of invoices) {
        const days = Math.floor((now.getTime() - (inv.dueDate || inv.invoiceDate).getTime()) / 86400000)
        const amt  = inv.balanceDue
        const pid  = inv.party.id
        if (!partyMap[pid]) partyMap[pid] = { id: pid, name: inv.party.name, total: 0, b0: 0, b30: 0, b60: 0, b90: 0 }
        partyMap[pid].total += amt
        if (days <= 30)       { buckets.b0  += amt; partyMap[pid].b0  += amt }
        else if (days <= 60)  { buckets.b30 += amt; partyMap[pid].b30 += amt }
        else if (days <= 90)  { buckets.b60 += amt; partyMap[pid].b60 += amt }
        else                  { buckets.b90 += amt; partyMap[pid].b90 += amt }
    }
    const parties = Object.values(partyMap).sort((a, b) => b.total - a.total)
    const grandTotal = parties.reduce((s, p) => s + p.total, 0)
    return { buckets, parties, grandTotal, invoiceCount: invoices.length }
}

// ─── 5. Outstanding Payable Report ────────────────────────────────────────────

export async function getOutstandingPayableReport() {
    const userId = await requireUserId()
    const invoices = await prisma.purchaseInvoice.findMany({
        where: { userId, deletedAt: null, status: "active", paymentStatus: { in: ["unpaid", "partial"] }, balanceDue: { gt: 0 } },
        include: { party: { select: { id: true, name: true } } },
        orderBy: { invoiceDate: "asc" },
    })
    const now = new Date()
    const buckets = { b0: 0, b30: 0, b60: 0, b90: 0 }
    type PartyRow = { id: string; name: string; total: number; b0: number; b30: number; b60: number; b90: number }
    const partyMap: Record<string, PartyRow> = {}

    for (const inv of invoices) {
        const days = Math.floor((now.getTime() - (inv.dueDate || inv.invoiceDate).getTime()) / 86400000)
        const amt  = inv.balanceDue
        const pid  = inv.party.id
        if (!partyMap[pid]) partyMap[pid] = { id: pid, name: inv.party.name, total: 0, b0: 0, b30: 0, b60: 0, b90: 0 }
        partyMap[pid].total += amt
        if (days <= 30)       { buckets.b0  += amt; partyMap[pid].b0  += amt }
        else if (days <= 60)  { buckets.b30 += amt; partyMap[pid].b30 += amt }
        else if (days <= 90)  { buckets.b60 += amt; partyMap[pid].b60 += amt }
        else                  { buckets.b90 += amt; partyMap[pid].b90 += amt }
    }
    const parties = Object.values(partyMap).sort((a, b) => b.total - a.total)
    const grandTotal = parties.reduce((s, p) => s + p.total, 0)
    return { buckets, parties, grandTotal, invoiceCount: invoices.length }
}

// ─── 10. Cash/Bank Book Report ────────────────────────────────────────────────

export async function getCashBankBookReport(range: DateRange, accountId: string) {
    const account = await prisma.bankAccount.findUnique({ where: { id: accountId } })
    if (!account) throw new Error("Account not found")

    // Payments In credited to this account
    const paymentsIn = await prisma.paymentMode.findMany({
        where: { bankAccountId: accountId, payment: { paymentType: "IN", deletedAt: null, ...dateWhere("paymentDate", range) } },
        include: { payment: { include: { party: { select: { name: true } } } } },
    })
    // Payments Out debited from this account
    const paymentsOut = await prisma.paymentMode.findMany({
        where: { bankAccountId: accountId, payment: { paymentType: "OUT", deletedAt: null, ...dateWhere("paymentDate", range) } },
        include: { payment: { include: { party: { select: { name: true } } } } },
    })
    // Transfers In
    const transfersIn = await prisma.accountTransfer.findMany({
        where: { toAccountId: accountId, ...dateWhere("transferDate", range) },
        include: { fromAccount: { select: { accountName: true } } },
    })
    // Transfers Out
    const transfersOut = await prisma.accountTransfer.findMany({
        where: { fromAccountId: accountId, ...dateWhere("transferDate", range) },
        include: { toAccount: { select: { accountName: true } } },
    })
    // Expenses linked to this account
    const expenses = await prisma.expense.findMany({
        where: { bankAccountId: accountId, deletedAt: null, ...dateWhere("expenseDate", range) },
    })

    type Entry = { date: Date; type: string; description: string; reference: string; debit: number; credit: number }
    const entries: Entry[] = [
        ...paymentsIn.map(pm => ({ date: pm.payment.paymentDate, type: "Payment In", description: pm.payment.party.name, reference: `PMT-${pm.payment.id.slice(-6).toUpperCase()}`, debit: 0, credit: pm.amount })),
        ...paymentsOut.map(pm => ({ date: pm.payment.paymentDate, type: "Payment Out", description: pm.payment.party.name, reference: `PMT-${pm.payment.id.slice(-6).toUpperCase()}`, debit: pm.amount, credit: 0 })),
        ...transfersIn.map(t => ({ date: t.transferDate, type: "Transfer In", description: `From ${t.fromAccount.accountName}`, reference: `TRF-${t.id.slice(-6).toUpperCase()}`, debit: 0, credit: t.amount })),
        ...transfersOut.map(t => ({ date: t.transferDate, type: "Transfer Out", description: `To ${t.toAccount.accountName}`, reference: `TRF-${t.id.slice(-6).toUpperCase()}`, debit: t.amount, credit: 0 })),
        ...expenses.map(e => ({ date: e.expenseDate, type: "Expense", description: `${e.category}${e.description ? ` — ${e.description}` : ""}`, reference: e.category, debit: e.amount, credit: 0 })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    let balance = account.openingBalance
    const entriesWithBalance = entries.map(e => { balance += e.credit - e.debit; return { ...e, balance } })
    const totalDebit  = entries.reduce((s, e) => s + e.debit, 0)
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0)
    return { account, entries: entriesWithBalance, totalDebit, totalCredit, closingBalance: balance }
}

// ─── Utility: Fetch bank accounts for cash/bank book ─────────────────────────

export async function getBankAccountsForReports() {
    const userId = await requireUserId()
    return prisma.bankAccount.findMany({ where: { userId, deletedAt: null }, select: { id: true, accountName: true, isCash: true, currentBalance: true }, orderBy: { isCash: "desc" } })
}
