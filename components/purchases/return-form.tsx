"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save, Loader2, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/gst-utils"
import { createPurchaseReturn } from "@/lib/actions/purchase-returns"
import { format } from "date-fns"

interface ReturnFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoices: any[]
}

interface ReturnItem {
    selected: boolean
    itemId: string | null
    itemName: string
    hsnCode: string
    maxQuantity: number
    quantity: number
    unit: string
    unitPrice: number
    discount: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    discountType: any
    gstRate: number
}

export function PurchaseReturnForm({ invoices }: ReturnFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preselectedInvoiceId = searchParams.get("invoiceId") || ""

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoiceId)
    const [debitNoteDate, setDebitNoteDate] = useState(
        new Date().toISOString().split("T")[0]
    )
    const [reason, setReason] = useState("")
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([])

    // Get selected invoice
    const selectedInvoice = useMemo(() => {
        return invoices.find((inv) => inv.id === selectedInvoiceId)
    }, [invoices, selectedInvoiceId])

    // When invoice changes, populate return items
    const handleInvoiceChange = (invoiceId: string) => {
        setSelectedInvoiceId(invoiceId)
        const invoice = invoices.find((inv) => inv.id === invoiceId)
        if (!invoice) {
            setReturnItems([])
            return
        }

        // Calculate already-returned quantities
        const returnedQty: Record<string, number> = {}
        if (invoice.purchaseReturns) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const pr of invoice.purchaseReturns as any[]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                for (const item of pr.items as any[]) {
                    const key = item.itemId || item.itemName
                    returnedQty[key] = (returnedQty[key] || 0) + item.quantity
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: ReturnItem[] = invoice.items.map((item: any) => {
            const key = item.itemId || item.itemName
            const alreadyReturned = returnedQty[key] || 0
            const maxReturn = Math.max(0, item.quantity - alreadyReturned)
            return {
                selected: false,
                itemId: item.itemId,
                itemName: item.itemName,
                hsnCode: item.hsnCode || "",
                maxQuantity: maxReturn,
                quantity: maxReturn,
                unit: item.unit,
                unitPrice: item.unitPrice,
                discount: item.discount,
                discountType: item.discountType,
                gstRate: item.gstRate,
            }
        })

        setReturnItems(items)
    }

    // Select/deselect return item
    const toggleItem = (index: number) => {
        const newItems = [...returnItems]
        newItems[index].selected = !newItems[index].selected
        setReturnItems(newItems)
    }

    // Select all
    const selectAll = () => {
        const allSelected = returnItems.every((i) => i.selected)
        setReturnItems(returnItems.map((i) => ({ ...i, selected: !allSelected })))
    }

    // Update return quantity
    const updateQuantity = (index: number, qty: number) => {
        const newItems = [...returnItems]
        newItems[index].quantity = Math.min(qty, newItems[index].maxQuantity)
        setReturnItems(newItems)
    }

    // Calculate return totals
    const returnTotal = useMemo(() => {
        return returnItems
            .filter((i) => i.selected)
            .reduce((sum, item) => {
                const base = item.unitPrice * item.quantity
                let disc = 0
                if (item.discountType === "percent") disc = (base * item.discount) / 100
                else disc = item.discount
                const taxable = base - disc
                const gst = (taxable * item.gstRate) / 100
                return sum + taxable + gst
            }, 0)
    }, [returnItems])

    const handleSubmit = async () => {
        setError("")

        if (!selectedInvoiceId) {
            setError("Please select an invoice")
            return
        }

        const selectedItems = returnItems.filter((i) => i.selected && i.quantity > 0)
        if (selectedItems.length === 0) {
            setError("Please select at least one item to return")
            return
        }

        // Check max quantity
        for (const item of selectedItems) {
            if (item.quantity > item.maxQuantity) {
                setError(`Cannot return more than ${item.maxQuantity} for "${item.itemName}"`)
                return
            }
        }

        setLoading(true)
        try {
            const result = await createPurchaseReturn({
                debitNoteDate: new Date(debitNoteDate),
                purchaseInvoiceId: selectedInvoiceId,
                partyId: selectedInvoice.partyId,
                reason: reason || null,
                items: selectedItems.map((item) => ({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    hsnCode: item.hsnCode || null,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    discountType: item.discountType,
                    gstRate: item.gstRate,
                })),
            })

            if (result.success) {
                router.push("/dashboard/purchases")
            } else {
                setError(result.error || "Failed to create debit note")
            }
        } catch (err: any) {
            setError(err.message || "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/purchases")}
                        className="text-muted-foreground hover:text-foreground hover:bg-border h-9 w-9 p-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <RotateCcw size={20} className="text-primary" />
                            New Debit Note
                        </h1>
                        <p className="text-sm text-muted-foreground">Create a purchase return against an existing invoice</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                    {loading ? (
                        <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</>
                    ) : (
                        <><Save size={16} className="mr-2" /> Save Debit Note</>
                    )}
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
                    {error}
                </div>
            )}

            {/* Select Invoice */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Original Invoice</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Select Invoice *</Label>
                        <Select value={selectedInvoiceId} onValueChange={handleInvoiceChange}>
                            <SelectTrigger className="bg-background border-border text-foreground">
                                <SelectValue placeholder="Select an invoice" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground max-h-[250px]">
                                {invoices.map((inv) => (
                                    <SelectItem key={inv.id} value={inv.id}>
                                        {inv.invoiceNumber} — {inv.party?.name} — {formatCurrency(inv.grandTotal)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Debit Note Date *</Label>
                        <Input
                            type="date"
                            value={debitNoteDate}
                            onChange={(e) => setDebitNoteDate(e.target.value)}
                            className="bg-background border-border text-foreground"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Reason for Return</Label>
                    <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Defective items, overorder"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                </div>

                {/* Invoice Summary */}
                {selectedInvoice && (
                    <div className="bg-background rounded-lg p-3 flex gap-6 text-sm">
                        <div>
                            <span className="text-muted-foreground text-xs">Supplier:</span>{" "}
                            <span className="text-foreground">{selectedInvoice.party?.name}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-xs">Date:</span>{" "}
                            <span className="text-foreground">{format(new Date(selectedInvoice.invoiceDate), "dd MMM yyyy")}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-xs">Total:</span>{" "}
                            <span className="text-primary font-semibold">{formatCurrency(selectedInvoice.grandTotal)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Return Items */}
            {returnItems.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Items to Return</h3>
                        <button
                            type="button"
                            onClick={selectAll}
                            className="text-xs text-primary hover:underline"
                        >
                            {returnItems.every((i) => i.selected) ? "Deselect All" : "Select All"}
                        </button>
                    </div>

                    <div className="space-y-2">
                        {returnItems.map((item, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                                    item.selected
                                        ? "bg-primary/5 border-primary/20"
                                        : "bg-background border-border"
                                } ${item.maxQuantity <= 0 ? "opacity-50" : ""}`}
                            >
                                <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={() => toggleItem(idx)}
                                    disabled={item.maxQuantity <= 0}
                                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />

                                <div className="flex-1">
                                    <p className="text-sm text-foreground">{item.itemName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.hsnCode && `HSN: ${item.hsnCode} • `}
                                        Rate: {formatCurrency(item.unitPrice)} • GST: {item.gstRate}%
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground">Return Qty:</Label>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        max={item.maxQuantity}
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(idx, parseFloat(e.target.value) || 0)}
                                        disabled={!item.selected || item.maxQuantity <= 0}
                                        className="w-24 bg-background border-border text-foreground h-8 text-xs"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        / {item.maxQuantity} {item.unit}
                                    </span>
                                </div>

                                {item.maxQuantity <= 0 && (
                                    <Badge className="bg-border text-muted-foreground text-[10px] hover:bg-border">
                                        Fully Returned
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>

                    <Separator className="bg-border" />

                    {/* Return Total */}
                    <div className="flex justify-end">
                        <div className="bg-background rounded-lg p-4 w-72">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Items Selected</span>
                                <span className="text-foreground">{returnItems.filter((i) => i.selected).length}</span>
                            </div>
                            <Separator className="bg-border my-2" />
                            <div className="flex justify-between">
                                <span className="text-foreground font-bold">Debit Amount (Supplier owes us)</span>
                                <span className="text-emerald-400 font-bold text-lg">
                                    +{formatCurrency(Math.round(returnTotal))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
