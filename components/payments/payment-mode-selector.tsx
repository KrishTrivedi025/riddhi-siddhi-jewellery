"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, CreditCard, Landmark, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AmountInput } from "@/components/shared/amount-input"
import { getBankAccounts } from "@/lib/actions/banks"
import { PAYMENT_MODES } from "@/lib/payment-modes"
import { toast } from "sonner"

export interface PaymentModeLine {
    mode: string
    amount: number
    reference?: string
    bankAccountId?: string
}

// With a single payment mode its amount is always the whole total, so it mirrors the
// Total box instead of asking the user to type the same number twice. Once split into
// 2+ modes the amounts are the user's to divide.
export function syncSingleMode(modes: PaymentModeLine[], totalAmount: number): PaymentModeLine[] {
    return modes.length === 1 ? [{ ...modes[0], amount: totalAmount }] : modes
}

interface PaymentModeSelectorProps {
    modes: PaymentModeLine[]
    onChange: (modes: PaymentModeLine[]) => void
    totalAmount: number
}

export function PaymentModeSelector({ modes, onChange, totalAmount }: PaymentModeSelectorProps) {
    const [accounts, setAccounts] = useState<any[]>([])

    useEffect(() => {
        getBankAccounts()
            .then(setAccounts)
            .catch(() => toast.error("Failed to load bank accounts"))
    }, [])

    const addMode = () => {
        const currentSum = modes.reduce((sum, m) => sum + m.amount, 0)
        const remaining = Math.max(0, totalAmount - currentSum)
        
        // Default to Cash account if available
        const cashAcc = accounts.find(a => a.isCash)
        onChange([...modes, { 
            mode: "cash", 
            amount: remaining, 
            reference: "", 
            bankAccountId: cashAcc?.id 
        }])
    }

    const removeMode = (index: number) => {
        if (modes.length <= 1) return
        const newModes = [...modes]
        newModes.splice(index, 1)
        onChange(syncSingleMode(newModes, totalAmount))
    }

    const updateMode = (index: number, updates: Partial<PaymentModeLine>) => {
        const newModes = [...modes]
        
        // Auto-assign account when mode changes
        if (updates.mode) {
            if (updates.mode === "cash") {
                updates.bankAccountId = accounts.find(a => a.isCash)?.id
            } else if (!newModes[index].bankAccountId || accounts.find(a => a.id === newModes[index].bankAccountId)?.isCash) {
                // If switching to non-cash, pick the first bank account if available
                updates.bankAccountId = accounts.find(a => !a.isCash)?.id
            }
        }

        newModes[index] = { ...newModes[index], ...updates }
        onChange(newModes)
    }

    const currentSum = modes.reduce((sum, m) => sum + m.amount, 0)
    const isUnbalanced = Math.abs(currentSum - totalAmount) > 0.01

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    Payment Method(s)
                </Label>
                {modes.length < 5 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addMode}
                        className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                        <Plus size={14} className="mr-1" />
                        Add Mode (Split)
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {modes.map((m, idx) => (
                    <div key={idx} className="bg-background border border-border rounded-lg p-3 space-y-3 relative group">
                        {modes.length > 1 && (
                            <button
                                onClick={() => removeMode(idx)}
                                type="button"
                                className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                        
                        <div className="grid grid-cols-[1.5fr_1fr] gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Mode</Label>
                                <Select 
                                    value={m.mode} 
                                    onValueChange={(val) => updateMode(idx, { mode: val })}
                                >
                                    <SelectTrigger className="h-8 bg-background border-border text-xs focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        {PAYMENT_MODES.map((mode) => (
                                            <SelectItem key={mode.value} value={mode.value}>
                                                {mode.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                                <AmountInput
                                    value={m.amount}
                                    onValueChange={(amount) => updateMode(idx, { amount })}
                                    readOnly={modes.length === 1}
                                    className={`h-8 bg-background border-border text-xs font-bold text-emerald-500 focus:border-primary focus:ring-primary/20 transition-all ${modes.length === 1 ? "bg-muted/40" : ""}`}
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Account Selector */}
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    {m.mode === 'cash' ? <Wallet size={10} className="text-emerald-400" /> : <Landmark size={10} className="text-blue-400" />}
                                    Deposit / Withdraw From Account
                                </Label>
                                <Select 
                                    value={m.bankAccountId} 
                                    onValueChange={(val) => updateMode(idx, { bankAccountId: val })}
                                >
                                    <SelectTrigger className="h-8 bg-background border-border text-xs focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all">
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        {accounts
                                            .filter(a => m.mode === 'cash' ? a.isCash : !a.isCash)
                                            .map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.isCash ? "Cash" : acc.accountName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {(m.mode !== "cash") && (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Ref / UTR / Cheque #</Label>
                                <Input
                                    value={m.reference || ""}
                                    onChange={(e) => updateMode(idx, { reference: e.target.value })}
                                    className="h-8 bg-card border-border text-xs"
                                    placeholder="Optional reference"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {modes.length === 1 && (
                <p className="text-[10px] text-muted-foreground">
                    Amount fills in from the total. Tap &quot;Add Mode (Split)&quot; to divide it across payment modes.
                </p>
            )}

            {isUnbalanced && totalAmount > 0 && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-md text-[10px] text-rose-400 font-medium">
                    Warning: Mode amounts (₹{currentSum.toLocaleString("en-IN")}) don&apos;t match Total Amount (₹{totalAmount.toLocaleString("en-IN")}).
                </div>
            )}
        </div>
    )
}
