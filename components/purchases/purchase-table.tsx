"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Search, Eye, MoreHorizontal, CheckCircle2, Ban, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/gst-utils"
import { markPurchaseInvoiceAsPaid, voidPurchaseInvoice } from "@/lib/actions/purchases"
import { toast } from "sonner"
import { useConfirm } from "@/components/shared/confirm-provider"

interface PurchaseTableProps { invoices: any[] }

function getStatusBadge(status: string) {
    switch (status) {
        case "active":    return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">Active</Badge>
        case "cancelled": return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">Cancelled</Badge>
        default:          return <Badge className="bg-border text-muted-foreground hover:bg-border">{status}</Badge>
    }
}

function getPaymentBadge(status: string) {
    switch (status) {
        case "paid":    return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">Paid</Badge>
        case "partial": return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/10">Partial</Badge>
        case "unpaid":  return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">Unpaid</Badge>
        default:        return <Badge className="bg-border text-muted-foreground hover:bg-border">{status}</Badge>
    }
}

export function PurchaseTable({ invoices }: PurchaseTableProps) {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()
    const confirm = useConfirm()

    const filtered = invoices.filter((inv) => {
        const matchSearch = !search ||
            inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
            (inv.vendorInvoiceNumber && inv.vendorInvoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
            inv.party?.name?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === "all" || inv.paymentStatus === statusFilter
        return matchSearch && matchStatus
    })

    const handleMarkPaid = async (id: string) => {
        setLoading(id)
        const result = await markPurchaseInvoiceAsPaid(id)
        setLoading(null)
        if (result.success) { toast.success("Purchase marked as paid"); router.refresh() }
        else toast.error(result.error)
    }
    const handleVoid = async (id: string) => {
        const ok = await confirm({
            title: "Cancel this purchase?",
            description: "Stock will be reversed.",
            confirmText: "Cancel Purchase",
            variant: "destructive",
        })
        if (!ok) return
        setLoading(id)
        const result = await voidPurchaseInvoice(id)
        setLoading(null)
        if (result.success) { toast.success("Purchase cancelled"); router.refresh() }
        else toast.error(result.error)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search purchases..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground" />
                </div>
                <div className="flex gap-1 bg-card rounded-lg p-1 border border-border overflow-x-auto shrink-0">
                    {["all", "paid", "partial", "unpaid"].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap ${statusFilter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="border border-border rounded-xl p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                        <FileText size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No purchases found</p>
                    <Button onClick={() => router.push("/dashboard/purchases/new")} variant="ghost" className="text-primary hover:bg-primary/10">
                        Record your first purchase
                    </Button>
                </div>
            ) : (
                <>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {filtered.map((inv) => (
                            <div key={inv.id} onClick={() => router.push(`/dashboard/purchases/${inv.id}`)}
                                className="bg-card border border-border rounded-xl p-4 cursor-pointer active:scale-[0.99] transition-transform">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">{inv.party?.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {inv.invoiceNumber} · {format(new Date(inv.invoiceDate), "dd MMM yyyy")}
                                        </p>
                                        {inv.vendorInvoiceNumber && (
                                            <p className="text-xs text-muted-foreground">Bill: {inv.vendorInvoiceNumber}</p>
                                        )}
                                    </div>
                                    <p className="font-bold text-foreground text-base shrink-0">{formatCurrency(inv.grandTotal)}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2 flex-wrap">
                                        {getStatusBadge(inv.status)}
                                        {getPaymentBadge(inv.paymentStatus)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{inv.items?.length || 0} items</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block border border-border rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="text-muted-foreground">Internal #</TableHead>
                                    <TableHead className="text-muted-foreground">Vendor Bill #</TableHead>
                                    <TableHead className="text-muted-foreground">Date</TableHead>
                                    <TableHead className="text-muted-foreground">Supplier</TableHead>
                                    <TableHead className="text-muted-foreground">Items</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                                    <TableHead className="text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-muted-foreground">Payment</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((inv) => (
                                    <TableRow key={inv.id} className="border-border hover:bg-card/50 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/purchases/${inv.id}`)}>
                                        <TableCell className="font-medium text-foreground">{inv.invoiceNumber}</TableCell>
                                        <TableCell className="text-foreground">{inv.vendorInvoiceNumber || "—"}</TableCell>
                                        <TableCell className="text-muted-foreground">{format(new Date(inv.invoiceDate), "dd MMM yyyy")}</TableCell>
                                        <TableCell className="text-foreground">{inv.party?.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{inv.items?.length || 0} items</TableCell>
                                        <TableCell className="text-right font-semibold text-foreground">{formatCurrency(inv.grandTotal)}</TableCell>
                                        <TableCell>{getStatusBadge(inv.status)}</TableCell>
                                        <TableCell>{getPaymentBadge(inv.paymentStatus)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-border">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-border text-foreground" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/purchases/${inv.id}`)} className="hover:bg-border cursor-pointer">
                                                        <Eye size={14} className="mr-2" /> View Details
                                                    </DropdownMenuItem>
                                                    {inv.status !== "cancelled" && inv.paymentStatus !== "paid" && (
                                                        <DropdownMenuItem onClick={() => handleMarkPaid(inv.id)} disabled={loading === inv.id} className="hover:bg-border cursor-pointer text-emerald-400">
                                                            <CheckCircle2 size={14} className="mr-2" /> Mark as Paid
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator className="bg-border" />
                                                    {inv.status !== "cancelled" && (
                                                        <DropdownMenuItem onClick={() => handleVoid(inv.id)} disabled={loading === inv.id} className="hover:bg-border cursor-pointer text-amber-400">
                                                            <Ban size={14} className="mr-2" /> Cancel Purchase
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    )
}
