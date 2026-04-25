"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { itemSchema, ItemFormValues } from "@/lib/schemas/item-schema"
import { createItem, updateItem, createCategory } from "@/lib/actions/items"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus } from "lucide-react"
import { ImageCaptureWidget } from "./image-capture-widget"

interface ItemFormProps {
    initialData?: any
    categories: any[]
    onSuccess: () => void
    onCancel: () => void
}

export function ItemForm({ initialData, categories, onSuccess, onCancel }: ItemFormProps) {
    const [loading, setLoading] = useState(false)
    const [catList, setCatList] = useState(categories)
    const [newCatName, setNewCatName] = useState("")
    const [addingCat, setAddingCat] = useState(false)

    const form = useForm<ItemFormValues>({
        // @ts-ignore
        resolver: zodResolver(itemSchema),
        defaultValues: {
            itemCode: initialData?.itemCode || "",
            description: initialData?.description || "",
            categoryId: initialData?.categoryId || "",
            unit: initialData?.unit || "pcs",
            hsnCode: initialData?.hsnCode || "7113",
            gstRate: initialData?.gstRate ?? 3,
            purchasePrice: initialData?.purchasePrice || 0,
            salePrice: initialData?.salePrice || 0,
            openingStock: initialData?.openingStock || 0,
            currentStock: initialData?.currentStock || 0,
            lowStockAlert: initialData?.lowStockAlert || 0,
            imageUrl: initialData?.imageUrl || "",
        },
    })



    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = form

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return
        setAddingCat(true)
        try {
            const result = await createCategory(newCatName.trim())
            if (result.success && result.data) {
                setCatList([...catList, result.data])
                setValue("categoryId", result.data.id)
                setNewCatName("")
            }
        } catch (err) {
            console.error(err)
        } finally {
            setAddingCat(false)
        }
    }

    const onSubmit = async (data: ItemFormValues) => {
        setLoading(true)
        try {
            if (initialData?.id) {
                const result = await updateItem(initialData.id, data)
                if (!result.success) {
                    alert(result.error)
                    return
                }
            } else {
                const result = await createItem(data)
                if (!result.success) {
                    alert(result.error)
                    return
                }
            }
            onSuccess()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* ── Top Section: Basic Info & Tax ── */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
                <div className="space-y-4">
                    {/* Item Code */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Item Code *</Label>
                        <Input
                            {...register("itemCode")}
                            placeholder="e.g. GR-001"
                            className="bg-background border-border text-foreground h-11"
                        />
                        {errors.itemCode && (
                            <p className="text-xs text-rose-500">{errors.itemCode.message}</p>
                        )}
                    </div>

                    {/* Category & Unit Parallel */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</Label>
                            <Select
                                onValueChange={(val) => setValue("categoryId", val)}
                                defaultValue={initialData?.categoryId || ""}
                            >
                                <SelectTrigger className="bg-background border-border text-foreground h-11">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    {catList.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Unit</Label>
                            <Select
                                onValueChange={(val) => setValue("unit", val as any)}
                                defaultValue={initialData?.unit || "pcs"}
                            >
                                <SelectTrigger className="bg-background border-border text-foreground h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    <SelectItem value="gm">Grams (gm)</SelectItem>
                                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                    <SelectItem value="set">Set</SelectItem>
                                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* HSN & GST Parallel */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">HSN Code</Label>
                            <Input
                                {...register("hsnCode")}
                                placeholder="7113"
                                className="bg-background border-border text-foreground h-11 placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">GST Rate (%)</Label>
                            <Select
                                onValueChange={(val) => setValue("gstRate", parseFloat(val))}
                                defaultValue={String(initialData?.gstRate ?? 3)}
                            >
                                <SelectTrigger className="bg-background border-border text-foreground h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="0.25">0.25%</SelectItem>
                                    <SelectItem value="3">3% (Jewellery)</SelectItem>
                                    <SelectItem value="5">5%</SelectItem>
                                    <SelectItem value="12">12%</SelectItem>
                                    <SelectItem value="18">18%</SelectItem>
                                    <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Add New Category */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Add New Category</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="Quick add category..."
                                className="bg-background border-border text-foreground h-11 placeholder:text-muted-foreground"
                            />
                            <Button
                                type="button"
                                onClick={handleAddCategory}
                                disabled={addingCat || !newCatName.trim()}
                                className="bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all px-4 h-11 shrink-0"
                            >
                                {addingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={18} />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Photo */}
                <div className="flex flex-col">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Product Photo</Label>
                    <div className="flex-1 min-h-[200px]">
                        <ImageCaptureWidget
                            value={watch("imageUrl") as string}
                            onChange={(dataUrl) => setValue("imageUrl", dataUrl)}
                            onClear={() => setValue("imageUrl", "")}
                        />
                    </div>
                </div>
            </div>

            <Separator className="bg-border" />

            {/* ── Pricing ── */}
            <div>
                <h4 className="text-sm font-medium text-foreground mb-4">Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Production Price (₹)</Label>
                        <Input
                            type="text"
                            value={watch("purchasePrice") >= 10 ? watch("purchasePrice") : (watch("purchasePrice") || 0).toString().padStart(2, '0')}
                            onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = "" }}
                            onBlur={(e) => {
                                if (e.target.value === "") setValue("purchasePrice", 0)
                                else setValue("purchasePrice", parseFloat(e.target.value) || 0)
                            }}
                            onChange={(e) => setValue("purchasePrice", parseFloat(e.target.value) || 0)}
                            className="bg-background border-border text-foreground focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Sale Price (₹)</Label>
                        <Input
                            type="text"
                            value={watch("salePrice") >= 10 ? watch("salePrice") : (watch("salePrice") || 0).toString().padStart(2, '0')}
                            onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = "" }}
                            onBlur={(e) => {
                                if (e.target.value === "") setValue("salePrice", 0)
                                else setValue("salePrice", parseFloat(e.target.value) || 0)
                            }}
                            onChange={(e) => setValue("salePrice", parseFloat(e.target.value) || 0)}
                            className="bg-background border-border text-foreground focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </div>

            <Separator className="bg-border" />

            {/* ── Stock ── */}
            <div>
                <h4 className="text-sm font-medium text-foreground mb-4">Stock</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Opening Stock</Label>
                        <Input
                            type="text"
                            value={watch("openingStock") >= 10 ? watch("openingStock") : (watch("openingStock") || 0).toString().padStart(2, '0')}
                            onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = "" }}
                            onBlur={(e) => {
                                if (e.target.value === "") setValue("openingStock", 0)
                                else setValue("openingStock", parseFloat(e.target.value) || 0)
                            }}
                            onChange={(e) => setValue("openingStock", parseFloat(e.target.value) || 0)}
                            className="bg-background border-border text-foreground focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Current Stock</Label>
                        <Input
                            type="text"
                            value={watch("currentStock") >= 10 ? watch("currentStock") : (watch("currentStock") || 0).toString().padStart(2, '0')}
                            onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = "" }}
                            onBlur={(e) => {
                                if (e.target.value === "") setValue("currentStock", 0)
                                else setValue("currentStock", parseFloat(e.target.value) || 0)
                            }}
                            onChange={(e) => setValue("currentStock", parseFloat(e.target.value) || 0)}
                            className="bg-background border-border text-foreground focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Low Stock Alert</Label>
                        <Input
                            type="text"
                            value={watch("lowStockAlert") >= 10 ? watch("lowStockAlert") : (watch("lowStockAlert") || 0).toString().padStart(2, '0')}
                            onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = "" }}
                            onBlur={(e) => {
                                if (e.target.value === "") setValue("lowStockAlert", 0)
                                else setValue("lowStockAlert", parseFloat(e.target.value) || 0)
                            }}
                            onChange={(e) => setValue("lowStockAlert", parseFloat(e.target.value) || 0)}
                            className="bg-background border-border text-foreground focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </div>

            <Separator className="bg-border" />

            {/* ── Description ── */}
            <div className="space-y-2">
                <Label className="text-muted-foreground">Description</Label>
                <textarea
                    {...register("description")}
                    placeholder="Optional item description..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors resize-none"
                />
            </div>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="text-muted-foreground hover:text-foreground hover:bg-border"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                    {loading ? "Saving..." : initialData ? "Update Item" : "Save Item"}
                </Button>
            </div>
        </form>
    )
}
