"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Banknote, CreditCard, Smartphone, FileCheck } from "lucide-react"

interface InvoicePaymentProps {
    paymentMode: string
    amountPaid: number
    grandTotal: number
    onModeChange: (mode: string) => void
    onAmountChange: (amount: number) => void
}

const paymentModes = [
    { value: "none", label: "No Payment Now", icon: FileCheck },
    { value: "cash", label: "Cash", icon: Banknote },
    { value: "bank", label: "Bank Transfer", icon: CreditCard },
    { value: "upi", label: "UPI", icon: Smartphone },
    { value: "cheque", label: "Cheque", icon: FileCheck },
]

export function InvoicePayment({
    paymentMode,
    amountPaid,
    grandTotal,
    onModeChange,
    onAmountChange,
}: InvoicePaymentProps) {
    const balanceDue = Math.max(0, grandTotal - amountPaid)
    const status =
        amountPaid >= grandTotal && grandTotal > 0
            ? "paid"
            : amountPaid > 0
            ? "partial"
            : "unpaid"

    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Payment</h3>
                <Badge
                    className={`text-xs ${
                        status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : status === "partial"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    } hover:bg-transparent`}
                >
                    {status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid"}
                </Badge>
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={onModeChange}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                        {paymentModes.map(({ value, label, icon: Icon }) => (
                            <SelectItem key={value} value={value}>
                                <span className="flex items-center gap-2">
                                    <Icon size={14} />
                                    {label}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Amount Paid */}
            {paymentMode !== "none" && (
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Amount Paid (₹)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={grandTotal}
                        value={amountPaid}
                        onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                        className="bg-background border-border text-foreground"
                    />
                    <button
                        type="button"
                        onClick={() => onAmountChange(grandTotal)}
                        className="text-xs text-primary hover:underline"
                    >
                        Pay Full Amount
                    </button>
                </div>
            )}

            {/* Balance Due */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Balance Due</span>
                <span className={`text-sm font-bold ${balanceDue > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    ₹{balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    )
}
