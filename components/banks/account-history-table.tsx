"use client"

import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Receipt, Wallet, Landmark } from "lucide-react"
import { formatCurrency } from "@/lib/gst-utils"

interface AccountHistoryTableProps {
    transactions: any[]
}

const typeConfig: any = {
    "Payment Received": {
        color: "text-emerald-400 bg-emerald-500/10",
        icon: <ArrowDownLeft size={14} />
    },
    "Payment Made": {
        color: "text-rose-400 bg-rose-500/10",
        icon: <ArrowUpRight size={14} />
    },
    "Transfer In": {
        color: "text-blue-400 bg-blue-500/10",
        icon: <ArrowRightLeft size={14} />
    },
    "Transfer Out": {
        color: "text-amber-400 bg-amber-500/10",
        icon: <ArrowRightLeft size={14} />
    },
    "Expense": {
        color: "text-slate-400 bg-slate-500/10",
        icon: <Receipt size={14} />
    }
}

export function AccountHistoryTable({ transactions }: AccountHistoryTableProps) {
    return (
        <Card className="bg-card border-border">
            <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Transaction History
                    <span className="text-xs text-muted-foreground font-normal">({transactions.length} entries)</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Party / Account</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Reference</TableHead>
                            <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-sm">
                                    No transactions found for this account.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id} className="border-border hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(tx.date), "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-transparent ${typeConfig[tx.type]?.color}`}>
                                            {typeConfig[tx.type]?.icon}
                                            {tx.type}
                                            {tx.mode && (
                                                <span className="ml-1 opacity-60 font-medium">({tx.mode.toUpperCase()})</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-foreground font-medium">
                                        {tx.party || "N/A"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {tx.reference}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold text-sm ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
