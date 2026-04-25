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
import { PurchaseInvoiceItemFormValues } from "@/lib/schemas/purchase-schema"
import { calculateLineItemGST } from "@/lib/gst-utils"
import { ProductBrowserModal } from "../sales/product-browser-modal"
import { Image as ImageIcon } from "lucide-react"

interface InvoiceLineItemsProps {
    items: PurchaseInvoiceItemFormValues[]
    inventoryItems: any[]
    isInterState: boolean
    onChange: (items: PurchaseInvoiceItemFormValues[]) => void
}

const emptyItem: PurchaseInvoiceItemFormValues = {
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

export function PurchaseInvoiceLineItems({ items, inventoryItems, isInterState, onChange }: InvoiceLineItemsProps) {
    const [expandedRow, setExpandedRow] = useState<number | null>(null)

    const removeItem = (index: number) => {
        if (items.length <= 1) return
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

        const newItem: PurchaseInvoiceItemFormValues = {
            ...emptyItem,
            itemId: inv.id,
            itemName: inv.itemCode, // Store code as name for DB purposes
            hsnCode: inv.hsnCode || "7113",
            unit: inv.unit || "pcs",
            unitPrice: inv.purchasePrice || 0, // Using purchasePrice
            gstRate: inv.gstRate ?? 3,
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

    const getLineTotal = (item: PurchaseInvoiceItemFormValues) => {
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

            {/* Header Row */}
            <div className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_1fr_0.5fr_0.3fr] gap-2 px-2 text-xs text-muted-foreground font-medium">
                <span>Item</span>
                <span>HSN</span>
                <span>Qty</span>
                <span>Rate (₹)</span>
                <span>Disc</span>
                <span>GST %</span>
                <span className="text-right">Amount</span>
                <span></span>
            </div>

            {/* Item Rows */}
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="space-y-0">
                        {/* Main Row */}
                        <div className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_1fr_0.5fr_0.3fr] gap-2 items-center bg-card p-2 rounded-lg border border-border">
                            {/* Item Display */}
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const inv = inventoryItems.find((i: any) => i.id === item.itemId)
                                    if (!item.itemId) {
                                        return (
                                            <Input
                                                value={item.itemName}
                                                onChange={(e) => updateItem(idx, "itemName", e.target.value)}
                                                placeholder="Item Name"
                                                className="bg-background border-border text-foreground h-8 text-xs w-full"
                                            />
                                        )
                                    }
                                    return (
                                        <>
                                            {inv?.imageUrl ? (
                                                <img src={inv.imageUrl} alt="img" className="w-8 h-8 rounded-md object-cover border border-border" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground">
                                                    <ImageIcon size={14} />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-mono text-foreground font-semibold">{inv?.itemCode || "Unknown"}</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{inv?.category?.name || ""}</span>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>

                            {/* HSN */}
                            <Input
                                value={item.hsnCode || ""}
                                onChange={(e) => updateItem(idx, "hsnCode", e.target.value)}
                                placeholder="7113"
                                className="bg-background border-border text-foreground h-8 text-xs placeholder:text-muted-foreground"
                            />

                            {/* Quantity */}
                            <Input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                                className="bg-background border-border text-foreground h-8 text-xs"
                            />

                            {/* Unit Price */}
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                className="bg-background border-border text-foreground h-8 text-xs"
                            />

                            {/* Discount */}
                            <div className="flex gap-1">
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.discount}
                                    onChange={(e) => updateItem(idx, "discount", parseFloat(e.target.value) || 0)}
                                    className="bg-background border-border text-foreground h-8 text-xs flex-1"
                                />
                            </div>

                            {/* GST Rate */}
                            <Select
                                value={String(item.gstRate)}
                                onValueChange={(val) => updateItem(idx, "gstRate", parseFloat(val))}
                            >
                                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs">
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

                            {/* Amount */}
                            <p className="text-right text-xs font-semibold text-primary">
                                ₹{getLineTotal(item).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Jewellery details"
                                >
                                    {expandedRow === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeItem(idx)}
                                    className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                                    disabled={items.length <= 1}
                                >
                                    <Trash2 size={14} />
                                </button>
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
                                            type="number"
                                            step="0.001"
                                            value={item.netWeight || ""}
                                            onChange={(e) => updateItem(idx, "netWeight", parseFloat(e.target.value) || null)}
                                            className="bg-card border-border text-foreground h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Gross Weight (g)</Label>
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={item.grossWeight || ""}
                                            onChange={(e) => updateItem(idx, "grossWeight", parseFloat(e.target.value) || null)}
                                            className="bg-card border-border text-foreground h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Making Charges (₹)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.makingCharges || 0}
                                            onChange={(e) => updateItem(idx, "makingCharges", parseFloat(e.target.value) || 0)}
                                            className="bg-card border-border text-foreground h-8 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Wastage %</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.wastagePercent || 0}
                                            onChange={(e) => updateItem(idx, "wastagePercent", parseFloat(e.target.value) || 0)}
                                            className="bg-card border-border text-foreground h-8 text-xs"
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

            <div className="flex gap-2">
                <ProductBrowserModal inventoryItems={inventoryItems} onSelect={handleSelectProduct}>
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 h-10"
                    >
                        <Plus size={14} className="mr-2" />
                        Browse Inventory
                    </Button>
                </ProductBrowserModal>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onChange([...items, { ...emptyItem }])}
                    className="flex-1 border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 h-10"
                >
                    <Plus size={14} className="mr-2" />
                    Custom Line Item
                </Button>
            </div>
        </div>
    )
}
