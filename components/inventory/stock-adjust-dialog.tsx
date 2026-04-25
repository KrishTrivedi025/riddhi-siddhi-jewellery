"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { adjustStock } from "@/lib/actions/items"

interface StockAdjustDialogProps {
    item: { id: string; name: string; currentStock: number; unit: string }
    trigger: React.ReactNode
}

const REASONS = [
    "Damage",
    "Gift",
    "Personal Use",
    "Correction",
    "Return",
    "Purchase",
    "Production",
    "Other",
]

export function StockAdjustDialog({ item, trigger }: StockAdjustDialogProps) {
    const [open, setOpen] = useState(false)
    const [type, setType] = useState<"in" | "out">("in")
    const [quantity, setQuantity] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async () => {
        const qty = parseFloat(quantity)
        if (!qty || qty <= 0) {
            setError("Enter a valid quantity")
            return
        }
        if (!reason) {
            setError("Select a reason")
            return
        }

        setLoading(true)
        setError("")
        try {
            const result = await adjustStock(item.id, type, qty, reason)
            if (result.success) {
                setOpen(false)
                setQuantity("")
                setReason("")
                setType("in")
            } else {
                setError(result.error || "Failed to adjust stock")
            }
        } catch (err) {
            setError("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Adjust Stock</DialogTitle>
                </DialogHeader>
                <div className="pt-2 space-y-5">
                    {/* Item Info */}
                    <div className="px-4 py-3 rounded-lg bg-background border border-border">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current Stock:{" "}
                            <span className="text-primary font-semibold">
                                {item.currentStock} {item.unit}
                            </span>
                        </p>
                    </div>

                    {/* Type Toggle */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Adjustment Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType("in")}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
                                style={{
                                    backgroundColor: type === "in" ? "rgba(34,197,94,0.15)" : "transparent",
                                    borderColor: type === "in" ? "#22C55E" : "#2A2A2A",
                                    color: type === "in" ? "#22C55E" : "#A0A0A0",
                                }}
                            >
                                <ArrowUpCircle size={16} />
                                Stock In
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("out")}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
                                style={{
                                    backgroundColor: type === "out" ? "rgba(239,68,68,0.15)" : "transparent",
                                    borderColor: type === "out" ? "#EF4444" : "#2A2A2A",
                                    color: type === "out" ? "#EF4444" : "#A0A0A0",
                                }}
                            >
                                <ArrowDownCircle size={16} />
                                Stock Out
                            </button>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Quantity ({item.unit})</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Reason</Label>
                        <Select onValueChange={setReason} value={reason}>
                            <SelectTrigger className="bg-background border-border text-foreground">
                                <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                                {REASONS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-rose-500 px-1">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-muted-foreground hover:text-foreground hover:bg-border"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="font-semibold"
                            style={{
                                backgroundColor: type === "in" ? "#22C55E" : "#EF4444",
                                color: "#fff",
                            }}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : type === "in" ? (
                                "Add Stock"
                            ) : (
                                "Remove Stock"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
