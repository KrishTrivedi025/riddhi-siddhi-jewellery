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

interface ReturnTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    returns: any[]
}

export function PurchaseReturnTable({ returns }: ReturnTableProps) {
    const [search, setSearch] = useState("")

    const filtered = returns.filter((r) => {
        if (!search) return true
        return (
            r.debitNoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
            r.party?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.purchaseInvoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
        )
    })

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search debit notes..."
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
                            <TableHead className="text-muted-foreground">Debit Note #</TableHead>
                            <TableHead className="text-muted-foreground">Date</TableHead>
                            <TableHead className="text-muted-foreground">Original Invoice</TableHead>
                            <TableHead className="text-muted-foreground">Supplier</TableHead>
                            <TableHead className="text-muted-foreground">Items</TableHead>
                            <TableHead className="text-muted-foreground text-right">Credit Required</TableHead>
                            <TableHead className="text-muted-foreground">Reason</TableHead>
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
                                        <p className="text-muted-foreground text-sm">No debit notes found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r) => (
                                <TableRow key={r.id} className="border-border hover:bg-card/50 transition-colors">
                                    <TableCell className="font-medium text-foreground">
                                        {r.debitNoteNumber}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(r.debitNoteDate), "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-border text-muted-foreground">
                                            {r.purchaseInvoice?.invoiceNumber}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-foreground">
                                        {r.party?.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {r.items?.length || 0} items
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-emerald-400">
                                        +{formatCurrency(r.grandTotal)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                        {r.reason || "—"}
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
