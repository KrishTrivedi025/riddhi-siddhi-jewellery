"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { createPaymentIn } from "@/lib/actions/payments-in"
import { PaymentModeSelector, PaymentModeLine } from "./payment-mode-selector"
import { useTrackDirty } from "@/lib/hooks/use-unsaved-changes"

interface PaymentInFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customers: any[]
}

export function PaymentInForm({ customers }: PaymentInFormProps) {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Form State
    const [partyId, setPartyId] = useState("")
    const [isGst, setIsGst] = useState(true)
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
    const [modes, setModes] = useState<PaymentModeLine[]>([
        { mode: "cash", amount: 0 }
    ])
    const [notes, setNotes] = useState("")
    const [totalAmount, setTotalAmount] = useState<number>(0)

    useTrackDirty(!!partyId || modes.some((m) => m.amount > 0) || notes.trim() !== "")

    // Submit handler
    const handleSubmit = async () => {
        setError("")

        if (!partyId) {
            setError("Please select a customer.")
            return
        }

        if (totalAmount <= 0) {
            setError("Please enter a valid received amount.")
            return
        }

        const modesTotal = modes.reduce((sum, m) => sum + m.amount, 0)
        if (Math.abs(modesTotal - totalAmount) > 0.01) {
            setError(`Payment methods (₹${modesTotal}) don't add up to the Total Amount Received (₹${totalAmount}).`)
            return
        }

        setLoading(true)
        try {
            const result = await createPaymentIn({
                partyId,
                isGst,
                paymentDate: new Date(paymentDate),
                totalAmount,
                modes,
                notes: notes || undefined,
            })

            if (result.success) {
                router.push("/dashboard/payments")
            } else {
                setError(result.error || "Failed to record payment.")
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            {/* Header */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/payments")}
                        className="text-muted-foreground hover:text-foreground hover:bg-border h-9 w-9 p-0 flex-shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-foreground flex items-center gap-2 leading-tight">
                            <CreditCard size={18} className="text-emerald-400 flex-shrink-0" />
                            Record Payment Received
                        </h1>
                        <p className="text-xs text-muted-foreground">Log money received from a customer</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                >
                    {loading ? (
                        <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</>
                    ) : (
                        <><Save size={16} className="mr-2" /> Save Payment</>
                    )}
                </Button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
                    {error}
                </div>
            )}

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Payment Details</h3>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Customer *</Label>
                    <Select value={partyId} onValueChange={setPartyId}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground max-h-[300px]">
                            {customers.length === 0 && (
                                <div className="p-2 text-sm text-muted-foreground text-center">No outstanding debts found</div>
                            )}
                            {customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Ledger *</Label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsGst(true)}
                            className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-colors ${
                                isGst
                                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                    : "bg-background text-muted-foreground border-border"
                            }`}
                        >
                            With GST
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsGst(false)}
                            className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-colors ${
                                !isGst
                                    ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                                    : "bg-background text-muted-foreground border-border"
                            }`}
                        >
                            Without GST
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Total Amount Received (₹) *</Label>
                    <Input
                        type="text"
                        value={totalAmount >= 10 ? totalAmount : (totalAmount || 0).toString().padStart(2, '0')}
                        onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = "" }}
                        onBlur={(e) => {
                            if (e.target.value === "") setTotalAmount(0)
                            else setTotalAmount(parseFloat(e.target.value) || 0)
                        }}
                        onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                        className="bg-background border-border text-foreground text-lg font-bold h-12 text-emerald-500 focus:border-primary transition-all"
                        placeholder="0.00"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Payment Date *</Label>
                    <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="bg-background border-border text-foreground"
                    />
                </div>

                <Separator className="bg-border" />

                <PaymentModeSelector
                    modes={modes}
                    onChange={setModes}
                    totalAmount={totalAmount}
                />

                <div className="space-y-2 pt-2">
                    <Label className="text-xs text-muted-foreground">Internal Notes</Label>
                    <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        placeholder="Remarks..."
                    />
                </div>
            </div>
        </div>
    )
}
