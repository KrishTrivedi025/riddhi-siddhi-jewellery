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
import { InvoiceLineItems } from "./invoice-line-items"
import { InvoiceSummary } from "./invoice-summary"
import { InvoicePayment } from "./invoice-payment"
import { createSaleInvoice, updateSaleInvoice } from "@/lib/actions/sales"
import { INDIAN_STATES, isInterState } from "@/lib/indian-states"
import { calculateInvoiceTotals } from "@/lib/gst-utils"
import { SaleInvoiceItemFormValues } from "@/lib/schemas/sale-invoice-schema"
import { useTrackDirty } from "@/lib/hooks/use-unsaved-changes"

interface InvoiceFormProps {
    nextInvoiceNumber: string
    parties: any[]
    items: any[]
    businessProfile: any
    isGst: boolean
    invoiceId?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any
}

const emptyItem: SaleInvoiceItemFormValues = {
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

export function InvoiceForm({ nextInvoiceNumber, parties, items, businessProfile, isGst, invoiceId, initialData }: InvoiceFormProps) {
    const router = useRouter()
    const isEdit = !!invoiceId
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Form state
    const [invoiceDate, setInvoiceDate] = useState(() =>
        initialData ? new Date(initialData.invoiceDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
    )
    const [dueDate, setDueDate] = useState(() => {
        if (initialData?.dueDate) return new Date(initialData.dueDate).toISOString().split("T")[0]
        if (initialData) return ""
        const d = new Date()
        d.setDate(d.getDate() + 45)
        return d.toISOString().split("T")[0]
    })
    const [partyId, setPartyId] = useState(initialData?.partyId || "")
    const [placeOfSupply, setPlaceOfSupply] = useState(initialData?.placeOfSupply || businessProfile?.state || "")
    const [shipToAddress, setShipToAddress] = useState(initialData?.shipToAddress || "")
    const [lineItems, setLineItems] = useState<SaleInvoiceItemFormValues[]>(() =>
        initialData?.items?.length
            ? initialData.items.map((it: SaleInvoiceItemFormValues) => ({
                itemId: it.itemId ?? null,
                itemName: it.itemName,
                hsnCode: it.hsnCode || "",
                description: it.description || "",
                quantity: it.quantity,
                unit: it.unit,
                unitPrice: it.unitPrice,
                discount: it.discount,
                discountType: it.discountType,
                gstRate: it.gstRate,
                purity: it.purity || "",
                netWeight: it.netWeight ?? null,
                grossWeight: it.grossWeight ?? null,
                makingCharges: it.makingCharges || 0,
                wastagePercent: it.wastagePercent || 0,
                hallmarkNumber: it.hallmarkNumber || "",
                stoneDetails: it.stoneDetails || "",
            }))
            : [{ ...emptyItem, gstRate: isGst ? 3 : 0 }]
    )
    const [notes, setNotes] = useState(initialData?.notes || "")
    const [termsConditions, setTermsConditions] = useState(initialData?.termsConditions || "")
    const [paymentMode, setPaymentMode] = useState("none")
    const [amountPaid, setAmountPaid] = useState(initialData?.amountPaid || 0)

    useTrackDirty(
        !!partyId || lineItems.some((item) => item.itemName.trim() !== "") || notes.trim() !== "" || amountPaid > 0
    )

    // Compute is inter-state
    const interState = useMemo(() => {
        const businessState = businessProfile?.state || ""
        return isInterState(businessState, placeOfSupply)
    }, [businessProfile?.state, placeOfSupply])

    // Selected party's price multiplier — applied when a product is picked into a line item
    const priceMultiplier = useMemo(() => {
        const party = parties.find((p: any) => p.id === partyId)
        return party?.priceMultiplier || 1
    }, [parties, partyId])

    // Compute grand total for payment
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

    // When party changes, auto-set place of supply and address
    const handlePartyChange = (id: string) => {
        setPartyId(id)
        const party = parties.find((p: any) => p.id === id)
        if (party) {
            if (party.state) {
                setPlaceOfSupply(party.state)
            }
            
            const addressParts = [party.billingAddress, party.city, party.state, party.pincode].filter(Boolean)
            if (addressParts.length > 0) {
                setShipToAddress(addressParts.join(", "))
            } else {
                setShipToAddress("")
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
            setError("Please select a customer")
            return
        }
        if (!placeOfSupply) {
            setError("Please select place of supply")
            return
        }
        const validItems = lineItems.filter((item) => item.itemName.trim())
        if (validItems.length === 0) {
            setError("Please add at least one item")
            return
        }

        setLoading(true)
        try {
            const payload = {
                invoiceDate: new Date(invoiceDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                partyId,
                placeOfSupply,
                shipToAddress: shipToAddress || null,
                items: validItems,
                notes: notes || null,
                termsConditions: termsConditions || null,
                paymentMode: paymentMode as any,
                amountPaid,
                isGst,
            }
            const result = isEdit
                ? await updateSaleInvoice(invoiceId!, payload)
                : await createSaleInvoice(payload)

            if (result.success) {
                router.push(isEdit ? `/dashboard/sales/${invoiceId}` : "/dashboard/sales")
            } else {
                setError(result.error || `Failed to ${isEdit ? "update" : "create"} invoice`)
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
                        onClick={() => router.push(isEdit ? `/dashboard/sales/${invoiceId}` : "/dashboard/sales")}
                        className="text-muted-foreground hover:text-foreground hover:bg-border h-9 w-9 p-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-foreground">{isEdit ? "Edit Sale Invoice" : "New Sale Invoice"}</h1>
                            {isGst ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">WITH GST</span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">WITHOUT GST</span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">Invoice Number: <span className="text-primary font-medium">{nextInvoiceNumber}</span></p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                    {loading ? (
                        <><Loader2 size={16} className="mr-2 animate-spin" /> {isEdit ? "Updating..." : "Saving..."}</>
                    ) : (
                        <><Save size={16} className="mr-2" /> {isEdit ? "Update Invoice" : "Save Invoice"}</>
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
                        <h3 className="text-sm font-semibold text-foreground">Invoice Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Invoice Date */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Invoice Date *</Label>
                                <Input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => handleInvoiceDateChange(e.target.value)}
                                    className="bg-background border-border text-foreground"
                                />
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Due Date</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="bg-background border-border text-foreground"
                                />
                            </div>

                            {/* Customer */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Customer *</Label>
                                <Select value={partyId} onValueChange={handlePartyChange}>
                                    <SelectTrigger className="bg-background border-border text-foreground">
                                        <SelectValue placeholder="Select customer" />
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

                            {/* Place of Supply */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    Place of Supply *
                                    {interState && (
                                        <span className="ml-2 text-amber-400 text-[10px] font-medium">(Inter-State → IGST)</span>
                                    )}
                                </Label>
                                <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                                    <SelectTrigger className="bg-background border-border text-foreground">
                                        <SelectValue placeholder="Select state" />
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

                        {/* Ship To */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Ship To Address (Optional)</Label>
                            <Input
                                value={shipToAddress}
                                onChange={(e) => setShipToAddress(e.target.value)}
                                placeholder="Delivery address if different from billing"
                                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <Separator className="bg-border" />

                    {/* Line Items */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <InvoiceLineItems
                            items={lineItems}
                            inventoryItems={items}
                            isInterState={interState}
                            isGst={isGst}
                            priceMultiplier={priceMultiplier}
                            onChange={setLineItems}
                        />
                    </div>

                    <Separator className="bg-border" />

                    {/* Notes & Terms */}
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Notes & Terms</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Notes</Label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any additional notes..."
                                    rows={3}
                                    className="w-full rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Terms & Conditions</Label>
                                <textarea
                                    value={termsConditions}
                                    onChange={(e) => setTermsConditions(e.target.value)}
                                    placeholder="Terms and conditions..."
                                    rows={3}
                                    className="w-full rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column — Summary + Payment (1 col) */}
                <div className="space-y-4">
                    <InvoiceSummary items={lineItems} isInterState={interState} />
                    <InvoicePayment
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
