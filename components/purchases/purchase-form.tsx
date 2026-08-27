"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PurchaseInvoiceLineItems } from "./purchase-invoice-line-items"
import { PurchaseInvoiceSummary } from "./purchase-invoice-summary"
import { PurchaseInvoicePayment } from "./purchase-invoice-payment"
import { createPurchaseInvoice } from "@/lib/actions/purchases"
import { INDIAN_STATES, isInterState } from "@/lib/indian-states"
import { calculateInvoiceTotals } from "@/lib/gst-utils"
import { PurchaseInvoiceItemFormValues } from "@/lib/schemas/purchase-schema"
import { useTrackDirty } from "@/lib/hooks/use-unsaved-changes"

interface InvoiceFormProps {
    nextInvoiceNumber: string
    parties: any[]
    items: any[]
    businessProfile: any
}

const emptyItem: PurchaseInvoiceItemFormValues = {
    itemId: null,
    itemName: "",
    hsnCode: "7117",
    description: "",
    quantity: 1,
    unit: "pcs",
    unitPrice: 0,
    discount: 0,
    discountType: "percent",
    gstRate: 3,
    purity: "",
    netWeight: null,
    grossWeight: null,
    makingCharges: 0,
    wastagePercent: 0,
    hallmarkNumber: "",
    stoneDetails: "",
}

export function PurchaseInvoiceForm({ nextInvoiceNumber, parties, items, businessProfile }: InvoiceFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Form state
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0])
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 45)
        return d.toISOString().split("T")[0]
    })
    const [partyId, setPartyId] = useState("")
    const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("")
    const [placeOfSupply, setPlaceOfSupply] = useState(businessProfile?.state || "")
    const [lineItems, setLineItems] = useState<PurchaseInvoiceItemFormValues[]>([{ ...emptyItem }])
    const [notes, setNotes] = useState("")
    const [paymentMode, setPaymentMode] = useState("none")
    const [amountPaid, setAmountPaid] = useState(0)

    useTrackDirty(
        !!partyId || lineItems.some((item) => item.itemName.trim() !== "") || notes.trim() !== "" || amountPaid > 0
    )

    // Compute is inter-state based on BUSINESS state vs Supplier state. Reversing standard view.
    // For purchase, if Supplier state !== Business state, it's interstate (IGST).
    const interState = useMemo(() => {
        const businessState = businessProfile?.state || ""
        return isInterState(businessState, placeOfSupply)
    }, [businessProfile?.state, placeOfSupply])

    // Compute grand total
    const grandTotal = useMemo(() => {
        const validItems = lineItems
            .filter((item) => item.itemName && item.quantity > 0)
            .map((item) => ({
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                discount: item.discount,
                discountType: item.discountType,
                gstRate: item.gstRate,
                makingCharges: item.makingCharges || 0,
            }))
        const totals = calculateInvoiceTotals(validItems, interState)
        return totals.grandTotal
    }, [lineItems, interState])

    // When party changes, auto-set place of supply
    const handlePartyChange = (id: string) => {
        setPartyId(id)
        const party = parties.find((p: any) => p.id === id)
        if (party) {
            if (party.state) {
                setPlaceOfSupply(party.state)
            }
        }
    }

    const handleInvoiceDateChange = (val: string) => {
        setInvoiceDate(val)
        if (val) {
            const d = new Date(val)
            d.setDate(d.getDate() + 45)
            setDueDate(d.toISOString().split("T")[0])
        } else {
            setDueDate("")
        }
    }

    const handleSubmit = async () => {
        setError("")

        // Validation
        if (!partyId) {
            setError("Please select a supplier")
            return
        }
        if (!placeOfSupply) {
            setError("Please select supplier's place of supply")
            return
        }
        const validItems = lineItems.filter((item) => item.itemName.trim())
        if (validItems.length === 0) {
            setError("Please add at least one item")
            return
        }

        setLoading(true)
        try {
            const result = await createPurchaseInvoice({
                vendorInvoiceNumber: vendorInvoiceNumber || null,
                invoiceDate: new Date(invoiceDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                partyId,
                placeOfSupply,
                items: validItems,
                notes: notes || null,
                paymentMode: paymentMode as any,
                amountPaid,
            })

            if (result.success) {
                router.push("/dashboard/purchases")
            } else {
                setError(result.error || "Failed to create invoice")
            }
        } catch (err: any) {
            setError(err.message || "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/purchases")}
                        className="text-muted-foreground hover:text-foreground hover:bg-border h-9 w-9 p-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">New Purchase Invoice</h1>
                        <p className="text-sm text-muted-foreground">Internal Ref: <span className="text-primary font-medium">{nextInvoiceNumber}</span></p>
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
                        <><Save size={16} className="mr-2" /> Save Purchase</>
                    )}
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column — Main Form (2 cols) */}
                <div className="col-span-2 space-y-6">
                    {/* Invoice Details Card */}
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Purchase Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Supplier */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Supplier *</Label>
                                <Select value={partyId} onValueChange={handlePartyChange}>
                                    <SelectTrigger className="bg-background border-border text-foreground">
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground max-h-[200px]">
                                        {parties.map((party: any) => (
                                            <SelectItem key={party.id} value={party.id}>
                                                {party.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Vendor Invoice Number */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Vendor Bill / Invoice No.</Label>
                                <Input
                                    value={vendorInvoiceNumber}
                                    onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                                    placeholder="INV-XXX"
                                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                />
                            </div>

                            {/* Invoice Date */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Bill Date *</Label>
                                <Input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => handleInvoiceDateChange(e.target.value)}
                                    className="bg-background border-border text-foreground"
                                />
                            </div>

                            {/* Place of Supply */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    Supplier State *
                                    {interState && (
                                        <span className="ml-2 text-amber-400 text-[10px] font-medium">(Inter-State)</span>
                                    )}
                                </Label>
                                <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                                    <SelectTrigger className="bg-background border-border text-foreground">
                                        <SelectValue placeholder="Select supplier's state" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground max-h-[200px]">
                                        {INDIAN_STATES.map((state) => (
                                            <SelectItem key={state.code} value={state.name}>
                                                {state.code} - {state.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border" />

                    {/* Line Items */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <PurchaseInvoiceLineItems
                            items={lineItems}
                            inventoryItems={items}
                            isInterState={interState}
                            onChange={setLineItems}
                        />
                    </div>

                    <Separator className="bg-border" />

                    {/* Notes */}
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Internal Notes</Label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional notes about this purchase..."
                                rows={3}
                                className="w-full rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column — Summary + Payment (1 col) */}
                <div className="space-y-4">
                    <PurchaseInvoiceSummary items={lineItems} isInterState={interState} />
                    <PurchaseInvoicePayment
                        paymentMode={paymentMode}
                        amountPaid={amountPaid}
                        grandTotal={grandTotal}
                        onModeChange={setPaymentMode}
                        onAmountChange={setAmountPaid}
                    />
                </div>
            </div>
        </div>
    )
}
