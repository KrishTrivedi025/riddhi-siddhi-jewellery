"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    MoreHorizontal, Trash2, PencilLine,
    ChevronDown, CalendarDays, Filter,
    Receipt, TrendingDown,
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/lib/schemas/expense-schema"
import { deleteExpense } from "@/lib/actions/expenses"
import { formatCurrency } from "@/lib/gst-utils"
import { ExpenseDialog } from "./expense-dialog"
import { getBankAccounts } from "@/lib/actions/banks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Expense = {
    id:          string
    expenseDate: Date
    category:    string
    description: string | null
    amount:      number
    gstAmount:   number
    gstRate:     number
    bankAccount: { id: string; accountName: string; isCash: boolean } | null
}

const DATE_RANGES = [
    { label: "This Month",    value: "this_month" },
    { label: "Last Month",    value: "last_month" },
    { label: "Last 3 Months", value: "last_3_months" },
    { label: "This Year",     value: "this_year" },
    { label: "All Time",      value: "all" },
] as const

interface ExpenseTableProps {
    expenses: Expense[]
    accounts: Awaited<ReturnType<typeof getBankAccounts>>
}

export function ExpenseTable({ expenses, accounts }: ExpenseTableProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [dateRange, setDateRange]   = useState<string>("this_month")
    const [category,  setCategory]    = useState<string>("all")
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // ── Client-side filter ──────────────────────────────────────────────────
    const now = new Date()

    const filtered = expenses.filter((e) => {
        const d = new Date(e.expenseDate)

        // Date filter
        if (dateRange === "this_month") {
            if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false
        } else if (dateRange === "last_month") {
            const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            if (d.getMonth() !== lm.getMonth() || d.getFullYear() !== lm.getFullYear()) return false
        } else if (dateRange === "last_3_months") {
            const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1)
            if (d < cutoff) return false
        } else if (dateRange === "this_year") {
            if (d.getFullYear() !== now.getFullYear()) return false
        }

        // Category filter
        if (category !== "all" && e.category !== category) return false

        return true
    })

    async function handleDelete(id: string) {
        setDeletingId(id)
        try {
            const result = await deleteExpense(id)
            if (result.success) {
                toast.success("Expense deleted")
                startTransition(() => router.refresh())
            } else {
                toast.error(result.error || "Failed to delete")
            }
        } catch {
            toast.error("Failed to delete expense")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Table Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <TrendingDown size={14} className="text-rose-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Expense Ledger</p>
                        <p className="text-xs text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Date range filter */}
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="h-8 text-xs bg-background border-border text-foreground w-36 gap-1">
                            <CalendarDays size={12} className="text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                            {DATE_RANGES.map((r) => (
                                <SelectItem key={r.value} value={r.value} className="text-foreground text-xs focus:bg-primary/10 focus:text-primary">
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Category filter */}
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-8 text-xs bg-background border-border text-foreground w-36 gap-1">
                            <Filter size={12} className="text-muted-foreground" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                            <SelectItem value="all" className="text-foreground text-xs focus:bg-primary/10 focus:text-primary">
                                All Categories
                            </SelectItem>
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat} className="text-foreground text-xs focus:bg-primary/10 focus:text-primary">
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Category</TableHead>
                                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Description</TableHead>
                                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider text-right">GST ITC</TableHead>
                                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Account</TableHead>
                                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((expense) => {
                                const colorClass = CATEGORY_COLORS[expense.category as ExpenseCategory]
                                    || CATEGORY_COLORS["Miscellaneous"]
                                return (
                                    <TableRow
                                        key={expense.id}
                                        className="border-border hover:bg-background/60 transition-colors group"
                                    >
                                        <TableCell className="text-muted-foreground text-sm font-mono whitespace-nowrap">
                                            {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                                                colorClass
                                            )}>
                                                {expense.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                            {expense.description || (
                                                <span className="text-border italic">No description</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-rose-400 font-mono font-semibold">
                                                {formatCurrency(expense.amount)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {expense.gstAmount > 0 ? (
                                                <span className="text-emerald-400 font-mono text-sm">
                                                    {formatCurrency(expense.gstAmount)}
                                                </span>
                                            ) : (
                                                <span className="text-border text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {expense.bankAccount ? (
                                                <span className="text-muted-foreground text-xs flex items-center gap-1">
                                                    {expense.bankAccount.isCash ? "💵" : "🏦"}
                                                    {expense.bankAccount.accountName}
                                                </span>
                                            ) : (
                                                <span className="text-border text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-border"
                                                    >
                                                        <MoreHorizontal size={15} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="bg-card border-border w-36"
                                                >
                                                    <ExpenseDialog
                                                        accounts={accounts}
                                                        initialData={expense}
                                                        trigger={
                                                            <DropdownMenuItem
                                                                onSelect={(e) => e.preventDefault()}
                                                                className="text-foreground cursor-pointer focus:bg-border focus:text-foreground gap-2"
                                                            >
                                                                <PencilLine size={13} /> Edit
                                                            </DropdownMenuItem>
                                                        }
                                                    />
                                                    <DropdownMenuSeparator className="bg-border" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(expense.id)}
                                                        disabled={deletingId === expense.id}
                                                        className="text-rose-500 cursor-pointer focus:bg-rose-500/10 focus:text-rose-500 gap-2"
                                                    >
                                                        <Trash2 size={13} />
                                                        {deletingId === expense.id ? "Deleting..." : "Delete"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center mb-4">
                <Receipt size={28} className="text-rose-500/40" />
            </div>
            <h3 className="text-foreground font-semibold text-base mb-1">No expenses found</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
                No expense records match the selected filters. Try changing the date range or category.
            </p>
        </div>
    )
}
