"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    ArrowLeft, Download, Share2, CheckCircle2,
    Ban, RotateCcw, Loader2, Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/gst-utils"
import { formatItemDisplayName } from "@/lib/utils"
import { numberToWords } from "@/lib/amount-in-words"
import { markInvoiceAsPaid, voidInvoice } from "@/lib/actions/sales"
import { InvoicePDF } from "./invoice-pdf"
import { toast } from "sonner"
import { useConfirm } from "@/components/shared/confirm-provider"

interface InvoiceDetailProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoice: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    businessProfile: any
}

export function InvoiceDetail({ invoice, businessProfile }: InvoiceDetailProps) {
    const router = useRouter()
    const [loading, setLoading] = useState("")
    const [showPdf, setShowPdf] = useState(false)
    const confirm = useConfirm()

    const handleMarkPaid = async () => {
        setLoading("paid")
        const result = await markInvoiceAsPaid(invoice.id)
        setLoading("")
        if (result.success) { toast.success("Invoice marked as paid"); router.refresh() }
        else toast.error(result.error)
    }

    const handleVoid = async () => {
        const ok = await confirm({
            title: "Cancel this invoice?",
            description: "Stock will be reversed back into inventory.",
            confirmText: "Cancel Invoice",
            variant: "destructive",
        })
        if (!ok) return
        setLoading("void")
        const result = await voidInvoice(invoice.id)
        setLoading("")
        if (result.success) { toast.success("Invoice cancelled"); router.refresh() }
        else toast.error(result.error)
    }

    const handleWhatsAppShare = () => {
        const text = `Invoice ${invoice.invoiceNumber}\nAmount: ${formatCurrency(invoice.grandTotal)}\nCustomer: ${invoice.party?.name}\nDate: ${format(new Date(invoice.invoiceDate), "dd MMM yyyy")}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    }

    const isInterState = invoice.igst > 0

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            {/* Header — row 1: back + title */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/sales")}
                    className="text-muted-foreground hover:text-foreground hover:bg-border h-9 w-9 p-0 flex-shrink-0"
                >
                    <ArrowLeft size={18} />
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold text-foreground leading-tight">
                        {invoice.invoiceNumber}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
                        {invoice.dueDate && ` • Due: ${format(new Date(invoice.dueDate), "dd MMM yyyy")}`}
                    </p>
                </div>
            </div>

            {/* Header — row 2: action buttons */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWhatsAppShare}
                    className="text-emerald-400 hover:bg-emerald-400/10 border border-emerald-400/20 h-9 px-3 text-xs font-semibold"
                >
                    <Share2 size={14} className="mr-1.5" /> WA
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPdf(!showPdf)}
                    className="text-primary hover:bg-primary/10 border border-primary/20 h-9 px-3 text-xs font-semibold"
                >
                    <Download size={14} className="mr-1.5" /> PDF
                </Button>
                {invoice.status !== "cancelled" && invoice.paymentStatus !== "paid" && (
                    <Button
                        size="sm"
                        onClick={handleMarkPaid}
                        disabled={loading === "paid"}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3 text-xs font-semibold"
                    >
                        {loading === "paid"
                            ? <Loader2 size={14} className="mr-1.5 animate-spin" />
                            : <CheckCircle2 size={14} className="mr-1.5" />
                        }
                        Mark Paid
                    </Button>
                )}
                {invoice.status !== "cancelled" && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleVoid}
                        disabled={loading === "void"}
                        className="text-rose-400 hover:bg-rose-400/10 border border-rose-400/20 h-9 px-3 text-xs font-semibold"
                    >
                        <Ban size={14} className="mr-1.5" /> Cancel
                    </Button>
                )}
            </div>

            {/* PDF Preview */}
            {showPdf && (
                <div className="bg-card border border-border rounded-xl p-4">
                    <InvoicePDF invoice={invoice} businessProfile={businessProfile} />
                </div>
            )}

            {/* Status Badges */}
            <div className="flex gap-3">
                <Badge className={`${
                    invoice.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                } hover:bg-transparent`}>
                    {invoice.status === "active" ? "Active" : "Cancelled"}
                </Badge>
                <Badge className={`${
                    invoice.paymentStatus === "paid"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : invoice.paymentStatus === "partial"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                } hover:bg-transparent`}>
                    {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                </Badge>
                {invoice._count?.saleReturns > 0 && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-transparent">
                        {invoice._count.saleReturns} Return(s)
                    </Badge>
                )}
            </div>

            {/* Invoice Card */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Customer Details */}
                <div className="p-5 grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Bill To</p>
                        <p className="text-foreground font-semibold">{invoice.party?.name}</p>
                        {invoice.party?.gstin && (
                            <p className="text-xs text-muted-foreground mt-1">GSTIN: {invoice.party.gstin}</p>
                        )}
                        {invoice.party?.billingAddress && (
                            <p className="text-xs text-muted-foreground mt-1">{invoice.party.billingAddress}</p>
                        )}
                        {invoice.party?.state && (
                            <p className="text-xs text-muted-foreground">{invoice.party.city}, {invoice.party.state} {invoice.party.pincode}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Place of Supply</p>
                        <p className="text-foreground text-sm">{invoice.placeOfSupply || "—"}</p>
                        {invoice.shipToAddress && (
                            <>
                                <p className="text-xs text-muted-foreground mt-3 mb-1">Ship To</p>
                                <p className="text-foreground text-sm">{invoice.shipToAddress}</p>
                            </>
                        )}
                    </div>
                </div>

                <Separator className="bg-border" />

                {/* Line Items Table */}
                <div className="p-5">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground text-xs">#</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Item</TableHead>
                                <TableHead className="text-muted-foreground text-xs">HSN</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Purity</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Qty</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Rate</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Disc</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">GST</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {invoice.items?.map((item: any, idx: number) => (
                                <TableRow key={item.id} className="border-border">
                                    <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                                    <TableCell>
                                        <p className="text-foreground text-sm">{formatItemDisplayName(item.itemName, item.item?.category?.name)}</p>
                                        {item.makingCharges > 0 && (
                                            <p className="text-[10px] text-muted-foreground">Making: ₹{item.makingCharges}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{item.hsnCode || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{item.purity || "—"}</TableCell>
                                    <TableCell className="text-right text-foreground text-sm">
                                        {item.quantity} {item.unit}
                                    </TableCell>
                                    <TableCell className="text-right text-foreground text-sm">
                                        {formatCurrency(item.unitPrice)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {item.discount > 0 ? (
                                            item.discountType === "percent" ? `${item.discount}%` : formatCurrency(item.discount)
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {item.gstRate}%
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-foreground text-sm">
                                        {formatCurrency(item.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <Separator className="bg-border" />

                {/* Totals */}
                <div className="p-5 flex justify-start">
                    <div className="w-80 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.totalDiscount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount</span>
                                <span className="text-emerald-400">-{formatCurrency(invoice.totalDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxable Amount</span>
                            <span className="text-foreground">{formatCurrency(invoice.taxableAmount)}</span>
                        </div>
                        <Separator className="bg-border" />
                        {isInterState ? (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">IGST</span>
                                <span className="text-foreground">{formatCurrency(invoice.igst)}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">CGST</span>
                                    <span className="text-foreground">{formatCurrency(invoice.cgst)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">SGST</span>
                                    <span className="text-foreground">{formatCurrency(invoice.sgst)}</span>
                                </div>
                            </>
                        )}
                        {invoice.roundOff !== 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Round Off</span>
                                <span className="text-foreground">{invoice.roundOff > 0 ? "+" : ""}{formatCurrency(invoice.roundOff)}</span>
                            </div>
                        )}
                        <Separator className="bg-border" />
                        <div className="flex justify-between pt-1">
                            <span className="text-foreground font-bold text-base">Grand Total</span>
                            <span className="text-primary font-bold text-lg">{formatCurrency(invoice.grandTotal)}</span>
                        </div>
                        <div className="bg-background rounded-lg p-2 mt-2">
                            <p className="text-xs text-muted-foreground italic">{numberToWords(invoice.grandTotal)}</p>
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Paid</span>
                            <span className="text-emerald-400">{formatCurrency(invoice.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Balance Due</span>
                            <span className={invoice.balanceDue > 0 ? "text-rose-400 font-semibold" : "text-emerald-400"}>
                                {formatCurrency(invoice.balanceDue)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {(invoice.notes || invoice.termsConditions) && (
                    <>
                        <Separator className="bg-border" />
                        <div className="p-5 grid grid-cols-2 gap-6">
                            {invoice.notes && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                    <p className="text-sm text-foreground">{invoice.notes}</p>
                                </div>
                            )}
                            {( (invoice.termsConditions && invoice.termsConditions.trim()) || (businessProfile?.termsConditions && businessProfile.termsConditions.trim()) ) && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Terms & Conditions</p>
                                    <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                                        { (invoice.termsConditions && invoice.termsConditions.trim()) 
                                            ? invoice.termsConditions 
                                            : businessProfile.termsConditions 
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Sale Returns Section */}
            {invoice.saleReturns && invoice.saleReturns.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <RotateCcw size={14} className="text-primary" />
                        Credit Notes
                    </h3>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground text-xs">CN #</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Items</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Reason</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {invoice.saleReturns.map((sr: any) => (
                                <TableRow key={sr.id} className="border-border">
                                    <TableCell className="text-foreground text-sm font-medium">{sr.creditNoteNumber}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(sr.creditNoteDate), "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{sr.items?.length || 0}</TableCell>
                                    <TableCell className="text-right text-rose-400 text-sm font-semibold">
                                        -{formatCurrency(sr.grandTotal)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{sr.reason || "—"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Quick Actions */}
            {invoice.status === "active" && (
                <div className="flex gap-3">
                    {invoice.paymentStatus === "unpaid" && (
                        <Button
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/sales/${invoice.id}/edit`)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                            <Edit size={16} className="mr-2" />
                            Edit Invoice
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/sales/returns/new?invoiceId=${invoice.id}`)}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                        <RotateCcw size={16} className="mr-2" />
                        Create Credit Note
                    </Button>
                </div>
            )}
        </div>
    )
}