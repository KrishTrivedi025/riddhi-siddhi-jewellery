"use client"

import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { SaleInvoiceItemFormValues } from "@/lib/schemas/sale-invoice-schema"
import { calculateLineItemGST, GST_PRICE_MULTIPLIER } from "@/lib/gst-utils"
import { ProductBrowserModal } from "./product-browser-modal"
import { Image as ImageIcon } from "lucide-react"

interface InvoiceLineItemsProps {
    items: SaleInvoiceItemFormValues[]
    inventoryItems: any[]
    isInterState: boolean
    isGst: boolean
    onChange: (items: SaleInvoiceItemFormValues[]) => void
}

const emptyItem: SaleInvoiceItemFormValues = {
    itemId: null,
    itemName: "",
    hsnCode: "",
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

export function InvoiceLineItems({ items, inventoryItems, isInterState, isGst, onChange }: InvoiceLineItemsProps) {
    const [expandedRow, setExpandedRow] = useState<number | null>(null)

    const removeItem = (index: number) => {
        if (items.length <= 1) {
            onChange([{ ...emptyItem, gstRate: isGst ? 3 : 0 }])
            if (expandedRow === index) setExpandedRow(null)
            return
        }
        const newItems = items.filter((_, i) => i !== index)
        onChange(newItems)
        if (expandedRow === index) setExpandedRow(null)
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        onChange(newItems)
    }

    const handleSelectProduct = (inv: any) => {
        // If the item is already selected, just increment quantity
        const existingIdx = items.findIndex((i) => i.itemId === inv.id)
        if (existingIdx >= 0) {
            updateItem(existingIdx, "quantity", items[existingIdx].quantity + 1)
            return
        }

        const newItem: SaleInvoiceItemFormValues = {
            ...emptyItem,
            itemId: inv.id,
            itemName: inv.itemCode, // Store code as name for DB purposes
            hsnCode: inv.hsnCode || "7117",
            unit: inv.unit || "pcs",
            unitPrice: isGst
                ? Math.round((inv.salePrice || 0) * GST_PRICE_MULTIPLIER * 100) / 100
                : inv.salePrice || 0,
            gstRate: isGst ? (inv.gstRate ?? 3) : 0,
            purity: inv.purity || "",
            makingCharges: inv.makingCharges || 0,
        }

        // Replace the default empty item if it's the only one
        if (items.length === 1 && !items[0].itemId && !items[0].itemName) {
            onChange([newItem])
        } else {
            onChange([...items, newItem])
        }
    }

    const getLineTotal = (item: SaleInvoiceItemFormValues) => {
        const gst = calculateLineItemGST(
            item.unitPrice,
            item.quantity,
            item.discount,
            item.discountType,
            item.gstRate,
            isInterState,
            item.makingCharges || 0
        )
        return gst.totalAmount
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
                <ProductBrowserModal inventoryItems={inventoryItems} onSelect={handleSelectProduct}>
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-primary hover:bg-primary/10 h-8 text-xs"
                    >
                        <Plus size={14} className="mr-1" />
                        Browse Products
                    </Button>
                </ProductBrowserModal>
            </div>

            {/* Item Rows */}
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="space-y-0">
                        {/* Mobile Card */}
                        <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                            {/* Row 1: Item info + delete */}
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const inv = inventoryItems.find((i: any) => i.id === item.itemId)
                                    if (!item.itemId) {
                                        return <span className="text-muted-foreground text-xs italic flex-1">No item selected</span>
                                    }
                                    return (
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {inv?.imageUrl ? (
                                                <img src={inv.imageUrl} alt="img" className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                                                    <ImageIcon size={16} />
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-mono text-primary font-bold text-sm">{inv?.itemCode || "Unknown"}</span>
                                                <span className="text-[11px] text-muted-foreground truncate">{inv?.category?.name || ""}</span>
                                            </div>
                                        </div>
                                    )
                                })()}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                        className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Jewellery details"
                                    >
                                        {expandedRow === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all"
                                        title="Remove item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Row 2: HSN + Qty + Rate */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">HSN</p>
                                    <Input
                                        value={item.hsnCode || ""}
                                        onChange={(e) => updateItem(idx, "hsnCode", e.target.value)}
                                        placeholder="7117"
                                        className="bg-background border-border text-foreground h-9 text-xs placeholder:text-muted-foreground"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Qty</p>
                                    <Input
                                        type="text"
                                        value={item.quantity || ""}
                                        placeholder="1"
                                        onFocus={(e) => e.target.select()}
                                        onBlur={(e) => {
                                            if (e.target.value === "") updateItem(idx, "quantity", 0)
                                            else updateItem(idx, "quantity", parseFloat(e.target.value) || 0)
                                        }}
                                        onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                                        className="bg-background border-border text-foreground h-9 text-xs focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Rate (₹)</p>
                                    <Input
                                        type="text"
                                        value={item.unitPrice || ""}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                        onBlur={(e) => {
                                            if (e.target.value === "") updateItem(idx, "unitPrice", 0)
                                            else updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)
                                        }}
                                        onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                        className="bg-background border-border text-foreground h-9 text-xs focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Disc + GST + Amount */}
                            <div className="grid grid-cols-3 gap-2 items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Disc</p>
                                    <Input
                                        type="text"
                                        value={item.discount || ""}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                        onBlur={(e) => {
                                            if (e.target.value === "") updateItem(idx, "discount", 0)
                                            else updateItem(idx, "discount", parseFloat(e.target.value) || 0)
                                        }}
                                        onChange={(e) => updateItem(idx, "discount", parseFloat(e.target.value) || 0)}
                                        className="bg-background border-border text-foreground h-9 text-xs focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">GST %</p>
                                    {isGst ? (
                                        <Select
                                            value={String(item.gstRate)}
                                            onValueChange={(val) => updateItem(idx, "gstRate", parseFloat(val))}
                                        >
                                            <SelectTrigger className="bg-background border-border text-foreground h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border text-foreground">
                                                <SelectItem value="0">0%</SelectItem>
                                                <SelectItem value="0.25">0.25%</SelectItem>
                                                <SelectItem value="3">3%</SelectItem>
                                                <SelectItem value="5">5%</SelectItem>
                                                <SelectItem value="12">12%</SelectItem>
                                                <SelectItem value="18">18%</SelectItem>
                                                <SelectItem value="28">28%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="h-9 flex items-center px-2 rounded-lg bg-muted border border-border opacity-60">
                                            <span className="text-xs text-muted-foreground font-medium">0% (No GST)</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Amount</p>
                                    <div className="h-9 flex items-center justify-end px-2 rounded-lg bg-primary/10 border border-primary/20">
                                        <p className="text-sm font-bold text-primary">
                                            ₹{getLineTotal(item).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Jewellery Details */}
                        {expandedRow === idx && (
                            <div className="bg-background border border-border border-t-0 rounded-b-lg p-3 space-y-3">
                                <p className="text-xs font-medium text-primary mb-2">Jewellery Details</p>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Purity / Karat</Label>
                                        <Input
                                            value={item.purity || ""}
                                            onChange={(e) => updateItem(idx, "purity", e.target.value)}
                                            placeholder="22K"
                                            className="bg-card border-border text-foreground h-8 text-xs placeholder:text-muted-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Net Weight (g)</Label>
                                         <Input
                                             type="text"
                                             value={item.netWeight ?? ""}
                                             placeholder="00"
                                             onFocus={(e) => e.target.select()}
                                             onBlur={(e) => {
                                                 if (e.target.value === "") updateItem(idx, "netWeight", null)
                                                 else updateItem(idx, "netWeight", parseFloat(e.target.value) || null)
                                             }}
                                             onChange={(e) => updateItem(idx, "netWeight", parseFloat(e.target.value) || null)}
                                             className="bg-card border-border text-foreground h-8 text-xs focus:border-primary transition-all"
                                         />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Gross Weight (g)</Label>
                                         <Input
                                             type="text"
                                             value={item.grossWeight ?? ""}
                                             placeholder="00"
                                             onFocus={(e) => e.target.select()}
                                             onBlur={(e) => {
                                                 if (e.target.value === "") updateItem(idx, "grossWeight", null)
                                                 else updateItem(idx, "grossWeight", parseFloat(e.target.value) || null)
                                             }}
                                             onChange={(e) => updateItem(idx, "grossWeight", parseFloat(e.target.value) || null)}
                                             className="bg-card border-border text-foreground h-8 text-xs focus:border-primary transition-all"
                                         />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Making Charges (₹)</Label>
                                         <Input
                                             type="text"
                                             value={item.makingCharges || ""}
                                             placeholder="00"
                                             onFocus={(e) => e.target.select()}
                                             onBlur={(e) => {
                                                 if (e.target.value === "") updateItem(idx, "makingCharges", 0)
                                                 else updateItem(idx, "makingCharges", parseFloat(e.target.value) || 0)
                                             }}
                                             onChange={(e) => updateItem(idx, "makingCharges", parseFloat(e.target.value) || 0)}
                                             className="bg-card border-border text-foreground h-8 text-xs focus:border-primary transition-all"
                                         />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Wastage %</Label>
                                         <Input
                                             type="text"
                                             value={item.wastagePercent || ""}
                                             placeholder="00"
                                             onFocus={(e) => e.target.select()}
                                             onBlur={(e) => {
                                                 if (e.target.value === "") updateItem(idx, "wastagePercent", 0)
                                                 else updateItem(idx, "wastagePercent", parseFloat(e.target.value) || 0)
                                             }}
                                             onChange={(e) => updateItem(idx, "wastagePercent", parseFloat(e.target.value) || 0)}
                                             className="bg-card border-border text-foreground h-8 text-xs focus:border-primary transition-all"
                                         />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Hallmark No.</Label>
                                        <Input
                                            value={item.hallmarkNumber || ""}
                                            onChange={(e) => updateItem(idx, "hallmarkNumber", e.target.value)}
                                            className="bg-card border-border text-foreground h-8 text-xs placeholder:text-muted-foreground"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs text-muted-foreground">Stone Details</Label>
                                        <Input
                                            value={item.stoneDetails || ""}
                                            onChange={(e) => updateItem(idx, "stoneDetails", e.target.value)}
                                            placeholder="Diamond, Ruby, etc."
                                            className="bg-card border-border text-foreground h-8 text-xs placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <ProductBrowserModal inventoryItems={inventoryItems} onSelect={handleSelectProduct}>
                <Button
                    type="button"
                    variant="ghost"
                    className="w-full border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 h-10"
                >
                    <Plus size={14} className="mr-2" />
                    Browse & Add Product
                </Button>
            </ProductBrowserModal>
        </div>
    )
}
