"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    Search, Eye, MoreHorizontal, CheckCircle2,
    XCircle, Ban, FileText,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/gst-utils"
import { markInvoiceAsPaid, voidInvoice, deleteSaleInvoice } from "@/lib/actions/sales"

interface InvoiceTableProps {
    invoices: any[]
}

function getStatusBadge(status: string) {
    switch (status) {
        case "active":
            return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">Active</Badge>
        case "cancelled":
            return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">Cancelled</Badge>
        default:
            return <Badge className="bg-border text-muted-foreground hover:bg-border">{status}</Badge>
    }
}

function getPaymentBadge(status: string) {
    switch (status) {
        case "paid":
            return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">Paid</Badge>
        case "partial":
            return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/10">Partial</Badge>
        case "unpaid":
            return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">Unpaid</Badge>
        default:
            return <Badge className="bg-border text-muted-foreground hover:bg-border">{status}</Badge>
    }
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const filtered = invoices.filter((inv) => {
        const matchSearch =
            !search ||
            inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
            inv.party?.name?.toLowerCase().includes(search.toLowerCase())

        const matchStatus =
            statusFilter === "all" || inv.paymentStatus === statusFilter

        return matchSearch && matchStatus
    })

    const handleMarkPaid = async (id: string) => {
        setLoading(id)
        await markInvoiceAsPaid(id)
        setLoading(null)
    }

    const handleVoid = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this invoice? Stock will be reversed.")) return
        setLoading(id)
        await voidInvoice(id)
        setLoading(null)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return
        setLoading(id)
        await deleteSaleInvoice(id)
        setLoading(null)
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search invoices..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                <div className="flex gap-1 bg-card rounded-lg p-1 border border-border">
                    {["all", "paid", "partial", "unpaid"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                                statusFilter === s
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground">Invoice #</TableHead>
                            <TableHead className="text-muted-foreground">Date</TableHead>
                            <TableHead className="text-muted-foreground">Customer</TableHead>
                            <TableHead className="text-muted-foreground">Items</TableHead>
                            <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Payment</TableHead>
                            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow className="border-border">
                                <TableCell colSpan={8} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                                            <FileText size={20} className="text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No invoices found</p>
                                        <Button
                                            onClick={() => router.push("/dashboard/sales/new")}
                                            variant="ghost"
                                            className="text-primary hover:bg-primary/10"
                                        >
                                            Create your first invoice
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((inv) => (
                                <TableRow
                                    key={inv.id}
                                    className="border-border hover:bg-card/50 cursor-pointer transition-colors"
                                    onClick={() => router.push(`/dashboard/sales/${inv.id}`)}
                                >
                                    <TableCell className="font-medium text-foreground">
                                        {inv.invoiceNumber}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(inv.invoiceDate), "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell className="text-foreground">
                                        {inv.party?.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {inv.items?.length || 0} items
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-foreground">
                                        {formatCurrency(inv.grandTotal)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                                    <TableCell>{getPaymentBadge(inv.paymentStatus)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-border"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="bg-card border-border text-foreground"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/dashboard/sales/${inv.id}`)}
                                                    className="hover:bg-border cursor-pointer"
                                                >
                                                    <Eye size={14} className="mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                {inv.status !== "cancelled" && inv.paymentStatus !== "paid" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleMarkPaid(inv.id)}
                                                        disabled={loading === inv.id}
                                                        className="hover:bg-border cursor-pointer text-emerald-400"
                                                    >
                                                        <CheckCircle2 size={14} className="mr-2" />
                                                        Mark as Paid
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator className="bg-border" />
                                                {inv.status !== "cancelled" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleVoid(inv.id)}
                                                        disabled={loading === inv.id}
                                                        className="hover:bg-border cursor-pointer text-amber-400"
                                                    >
                                                        <Ban size={14} className="mr-2" />
                                                        Cancel Invoice
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(inv.id)}
                                                    disabled={loading === inv.id}
                                                    className="hover:bg-border cursor-pointer text-rose-400"
                                                >
                                                    <XCircle size={14} className="mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
