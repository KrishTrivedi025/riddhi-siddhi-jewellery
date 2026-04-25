"use client"

import { useMemo } from "react"
import { SaleInvoiceItemFormValues } from "@/lib/schemas/sale-invoice-schema"
import { calculateInvoiceTotals, formatCurrency } from "@/lib/gst-utils"
import { numberToWords } from "@/lib/amount-in-words"
import { Separator } from "@/components/ui/separator"

interface InvoiceSummaryProps {
    items: SaleInvoiceItemFormValues[]
    isInterState: boolean
}

export function InvoiceSummary({ items, isInterState }: InvoiceSummaryProps) {
    const totals = useMemo(() => {
        const validItems = items
            .filter((item) => item.itemName && item.quantity > 0)
            .map((item) => ({
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                discount: item.discount,
                discountType: item.discountType,
                gstRate: item.gstRate,
                makingCharges: item.makingCharges || 0,
            }))
        return calculateInvoiceTotals(validItems, isInterState)
    }, [items, isInterState])

    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground mb-3">Invoice Summary</h3>

            <div className="space-y-2 text-sm">
                {/* Subtotal */}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(totals.subtotal)}</span>
                </div>

                {/* Discount */}
                {totals.totalDiscount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-emerald-400">-{formatCurrency(totals.totalDiscount)}</span>
                    </div>
                )}

                {/* Taxable Amount */}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxable Amount</span>
                    <span className="text-foreground">{formatCurrency(totals.taxableAmount)}</span>
                </div>

                <Separator className="bg-border" />

                {/* GST Breakup */}
                <div className="space-y-2">
                    <p className="text-xs font-medium text-primary">GST Breakup</p>
                    {isInterState ? (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">IGST</span>
                            <span className="text-foreground">{formatCurrency(totals.igst)}</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">CGST</span>
                                <span className="text-foreground">{formatCurrency(totals.cgst)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">SGST</span>
                                <span className="text-foreground">{formatCurrency(totals.sgst)}</span>
                            </div>
                        </>
                    )}
                </div>

                <Separator className="bg-border" />

                {/* Round Off */}
                {totals.roundOff !== 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Round Off</span>
                        <span className="text-foreground">
                            {totals.roundOff > 0 ? "+" : ""}{formatCurrency(totals.roundOff)}
                        </span>
                    </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between items-center pt-2">
                    <span className="text-foreground font-bold text-base">Grand Total</span>
                    <span className="text-primary font-bold text-lg">
                        {formatCurrency(totals.grandTotal)}
                    </span>
                </div>
            </div>

            {/* Amount in Words */}
            {totals.grandTotal > 0 && (
                <div className="bg-background rounded-lg p-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Amount in Words</p>
                    <p className="text-xs text-foreground italic">
                        {numberToWords(totals.grandTotal)}
                    </p>
                </div>
            )}
        </div>
    )
}
