"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Search, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/gst-utils"

interface PaymentTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payments: any[]
    type: "IN" | "OUT"
}

export function PaymentTable({ payments, type }: PaymentTableProps) {
    const [search, setSearch] = useState("")

    const filtered = payments.filter((p) => {
        if (!search) return true
        return (
            p.party?.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.saleInvoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
            p.purchaseInvoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
        )
    })

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground">Ref ID</TableHead>
                            <TableHead className="text-muted-foreground">Date</TableHead>
                            <TableHead className="text-muted-foreground">Party</TableHead>
                            <TableHead className="text-muted-foreground">Tied Invoice</TableHead>
                            <TableHead className="text-muted-foreground">Mode</TableHead>
                            <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                            <TableHead className="text-muted-foreground">Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow className="border-border">
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                                            <FileText size={20} className="text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No transactions logged</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((p) => (
                                <TableRow key={p.id} className="border-border hover:bg-card/50 transition-colors">
                                    <TableCell className="font-medium text-foreground text-xs">
                                        <span title={p.id}>{p.id.slice(0, 8)}...</span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(p.paymentDate), "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell className="text-foreground text-sm">
                                        {p.party?.name}
                                    </TableCell>
                                    <TableCell>
                                        {(p.saleInvoice || p.purchaseInvoice) ? (
                                            <Badge variant="outline" className="border-border text-muted-foreground">
                                                {p.saleInvoice?.invoiceNumber || p.purchaseInvoice?.invoiceNumber}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Advance / Unlinked</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                         <div className="flex gap-1 flex-wrap">
                                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                              {p.paymentModes?.map((mode: any) => (
                                                   <Badge key={mode.id} className="bg-border text-xs font-normal text-foreground uppercase border-none">
                                                       {mode.mode}
                                                   </Badge>
                                              ))}
                                         </div>
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {type === 'IN' ? '+' : '-'}{formatCurrency(p.totalAmount)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                                        {p.notes || "—"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
