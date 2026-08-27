"use client"

import { useState, useMemo, useTransition } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    CalendarIcon,
    FilterX,
    BookOpen,
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
} from "lucide-react"
import type { LedgerEntry } from "@/lib/actions/party-ledger"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface PartyLedgerTableProps {
    entries: LedgerEntry[]
    partyName: string
    onDateRangeChange?: (from?: Date, to?: Date) => void
}

const typeConfig: Record<
    LedgerEntry["type"],
    { label: string; variant: string; icon: React.ReactNode }
> = {
    opening: {
        label: "Opening",
        variant: "bg-primary/10 text-primary border-primary/20",
        icon: <BookOpen size={12} />,
    },
    sale: {
        label: "Sale",
        variant: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        icon: <TrendingUp size={12} />,
    },
    purchase: {
        label: "Purchase",
        variant: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: <TrendingDown size={12} />,
    },
    payment_in: {
        label: "Pymt In",
        variant: "bg-emerald-500/5 text-emerald-600 border-emerald-500/10",
        icon: <ArrowUpDown size={12} />,
    },
    payment_out: {
        label: "Pymt Out",
        variant: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: <ArrowUpDown size={12} />,
    },
    sale_return: {
        label: "Sale Return",
        variant: "bg-blue-500/5 text-blue-400 border-blue-500/10",
        icon: <TrendingDown size={12} />,
    },
    purchase_return: {
        label: "Purchase Return",
        variant: "bg-amber-500/5 text-amber-400 border-amber-500/10",
        icon: <TrendingUp size={12} />,
    },
}

export function PartyLedgerTable({
    entries,
    partyName,
    onDateRangeChange,
}: PartyLedgerTableProps) {
    const [search, setSearch] = useState("")
    const [fromDate, setFromDate] = useState<Date | undefined>()
    const [toDate, setToDate] = useState<Date | undefined>()
    const [fromOpen, setFromOpen] = useState(false)
    const [toOpen, setToOpen] = useState(false)
    const [, startTransition] = useTransition()

    const filtered = useMemo(() => {
        return entries.filter((entry) => {
            const matchSearch =
                !search ||
                entry.referenceNumber
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                entry.description
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                typeConfig[entry.type].label
                    .toLowerCase()
                    .includes(search.toLowerCase())

            const entryDate = new Date(entry.date)
            const matchFrom = !fromDate || entryDate >= fromDate
            const matchTo =
                !toDate ||
                entryDate <= new Date(toDate.setHours(23, 59, 59, 999))

            return matchSearch && matchFrom && matchTo
        })
    }, [entries, search, fromDate, toDate])

    const clearFilters = () => {
        setSearch("")
        setFromDate(undefined)
        setToDate(undefined)
        startTransition(() => {
            onDateRangeChange?.(undefined, undefined)
        })
    }

    const hasFilters = search || fromDate || toDate

    // Summary of filtered entries
    const totalDebit = filtered.reduce((s, e) => s + e.debit, 0)
    const totalCredit = filtered.reduce((s, e) => s + e.credit, 0)
    const closingBalance =
        filtered.length > 0
            ? filtered[filtered.length - 1].runningBalance
            : 0

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <BookOpen size={16} className="text-primary" />
                        Ledger Statement
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                            ({filtered.length} entries)
                        </span>
                    </CardTitle>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Input
                        placeholder="Search by reference or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
                    />

                    {/* From date */}
                    <Popover open={fromOpen} onOpenChange={setFromOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-9 border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all",
                                    fromDate && "border-primary/50 text-primary"
                                )}
                            >
                                <CalendarIcon size={14} className="mr-2" />
                                {fromDate ? format(fromDate, "dd MMM yyyy") : "From date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0 bg-card border-border"
                            align="start"
                        >
                            <Calendar
                                mode="single"
                                selected={fromDate}
                                onSelect={(d) => {
                                    setFromDate(d)
                                    setFromOpen(false)
                                    startTransition(() =>
                                        onDateRangeChange?.(d, toDate)
                                    )
                                }}
                                disabled={(d) =>
                                    toDate ? d > toDate : false
                                }
                                className="text-foreground"
                            />
                        </PopoverContent>
                    </Popover>

                    {/* To date */}
                    <Popover open={toOpen} onOpenChange={setToOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-9 border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all",
                                    toDate && "border-primary/50 text-primary"
                                )}
                            >
                                <CalendarIcon size={14} className="mr-2" />
                                {toDate ? format(toDate, "dd MMM yyyy") : "To date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0 bg-card border-border"
                            align="start"
                        >
                            <Calendar
                                mode="single"
                                selected={toDate}
                                onSelect={(d) => {
                                    setToDate(d)
                                    setToOpen(false)
                                    startTransition(() =>
                                        onDateRangeChange?.(fromDate, d)
                                    )
                                }}
                                disabled={(d) =>
                                    fromDate ? d < fromDate : false
                                }
                                className="text-foreground"
                            />
                        </PopoverContent>
                    </Popover>

                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-9 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/5"
                        >
                            <FilterX size={14} className="mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="text-muted-foreground text-xs w-28">
                                    Date
                                </TableHead>
                                <TableHead className="text-muted-foreground text-xs w-24">
                                    Type
                                </TableHead>
                                <TableHead className="text-muted-foreground text-xs w-32">
                                    Reference
                                </TableHead>
                                <TableHead className="text-muted-foreground text-xs">
                                    Description
                                </TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right w-28">
                                    Debit (₹)
                                </TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right w-28">
                                    Credit (₹)
                                </TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right w-32">
                                    Balance
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-32 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <BookOpen size={24} className="opacity-40" />
                                            <p className="text-sm italic">
                                                No transactions found
                                            </p>
                                            {hasFilters && (
                                                <p className="text-xs">
                                                    Try adjusting your filters
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((entry, idx) => {
                                    const tc = typeConfig[entry.type]
                                    const isPositiveBalance =
                                        entry.runningBalance >= 0
                                    return (
                                        <TableRow
                                            key={`${entry.id}-${idx}`}
                                            className={`border-border hover:bg-muted transition-colors ${
                                                entry.type === "opening"
                                                    ? "bg-primary/5"
                                                    : ""
                                            }`}
                                        >
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {format(
                                                    new Date(entry.date),
                                                    "dd MMM yyyy"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${tc.variant}`}
                                                >
                                                    {tc.icon}
                                                    {tc.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-primary">
                                                {entry.referenceNumber}
                                            </TableCell>
                                            <TableCell className="text-sm text-foreground max-w-xs truncate">
                                                {entry.description}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {entry.debit > 0 ? (
                                                    <span className="text-foreground font-medium">
                                                        ₹
                                                        {entry.debit.toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-border">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {entry.credit > 0 ? (
                                                    <span className="text-foreground font-medium">
                                                        ₹
                                                        {entry.credit.toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-border">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div
                                                    className={`font-semibold text-sm ${isPositiveBalance ? "text-emerald-600" : "text-rose-600"}`}
                                                >
                                                    ₹
                                                    {Math.abs(
                                                        entry.runningBalance
                                                    ).toLocaleString("en-IN")}
                                                    <span className="ml-1 text-[10px] opacity-60 font-normal">
                                                        {isPositiveBalance
                                                            ? "Dr"
                                                            : "Cr"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer summary */}
                {filtered.length > 0 && (
                    <div className="border-t border-border bg-muted/50 px-6 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-muted-foreground text-xs">Total Debit</span>
                                    <p className="text-foreground font-semibold">
                                        ₹{totalDebit.toLocaleString("en-IN")}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs">Total Credit</span>
                                    <p className="text-foreground font-semibold">
                                        ₹{totalCredit.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-muted-foreground text-xs">Closing Balance</span>
                                <p
                                    className={`font-bold text-base ${closingBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                                >
                                    ₹
                                    {Math.abs(closingBalance).toLocaleString(
                                        "en-IN"
                                    )}
                                    <span className="ml-1 text-xs font-normal">
                                        {closingBalance >= 0 ? "Dr" : "Cr"}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
