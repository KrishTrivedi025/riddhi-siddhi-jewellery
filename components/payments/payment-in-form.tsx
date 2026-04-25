"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, CreditCard, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/gst-utils"
import { getCustomerOutstandingInvoices, createPaymentIn } from "@/lib/actions/payments-in"
import { format } from "date-fns"
import { PaymentModeSelector, PaymentModeLine } from "./payment-mode-selector"

interface PaymentInFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customers: any[]
}

interface AllocatableInvoice {
    id: string
    invoiceNumber: string
    invoiceDate: Date
    grandTotal: number
    amountPaid: number
    balanceDue: number
    amountApplied: number
}

// Payment Modes are now handled by PaymentModeSelector

export function PaymentInForm({ customers }: PaymentInFormProps) {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [fetchingInvoices, setFetchingInvoices] = useState(false)
    const [error, setError] = useState("")
    
    // Form State
    const [partyId, setPartyId] = useState("")
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
    const [modes, setModes] = useState<PaymentModeLine[]>([
        { mode: "cash", amount: 0 }
    ])
    const [notes, setNotes] = useState("")
    const [totalAmount, setTotalAmount] = useState<number>(0)
    
    // Invoices State
    const [invoices, setInvoices] = useState<AllocatableInvoice[]>([])

    // Load Invoices when Customer changes
    const handleCustomerChange = async (id: string) => {
        setPartyId(id)
        setInvoices([])
        setError("")
        setTotalAmount(0)
        setModes([{ mode: "cash", amount: 0 }])
        
        if (!id) return

        setFetchingInvoices(true)
        try {
            const data = await getCustomerOutstandingInvoices(id)
            const mapInvoices = data.map(inv => ({
                ...inv,
                amountApplied: 0
            }))
            setInvoices(mapInvoices)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "Failed to load invoices")
        } finally {
            setFetchingInvoices(false)
        }
    }

    // Handle allocation input change
    const handleAllocationChange = (index: number, val: string) => {
        const numVal = parseFloat(val) || 0
        const newInvoices = [...invoices]
        // Cap the amount applied to the max balance due automatically
        newInvoices[index].amountApplied = Math.max(0, Math.min(numVal, newInvoices[index].balanceDue))
        setInvoices(newInvoices)
    }

    // Auto-allocate button (distributes totalAmount across oldest invoices first)
    const handleAutoAllocate = () => {
        if (!totalAmount || totalAmount <= 0) {
             setError("Enter Total Amount First")
             return
        }
        setError("")

        let remaining = totalAmount
        const newInvoices = [...invoices].map(inv => {
             if (remaining >= inv.balanceDue) {
                  remaining -= inv.balanceDue
                  return { ...inv, amountApplied: inv.balanceDue }
             } else if (remaining > 0) {
                  const applied = remaining
                  remaining = 0
                  return { ...inv, amountApplied: applied }
             } else {
                  return { ...inv, amountApplied: 0 }
             }
        })
        setInvoices(newInvoices)
    }

    // Get current total allocations
    const currentAllocated = useMemo(() => {
        return invoices.reduce((sum, inv) => sum + inv.amountApplied, 0)
    }, [invoices])

    const totalOutstanding = useMemo(() => {
        return invoices.reduce((sum, inv) => sum + inv.balanceDue, 0)
    }, [invoices])

    const currentModesTotal = useMemo(() => {
        return modes.reduce((sum, m) => sum + m.amount, 0)
    }, [modes])

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
        
        if (Math.abs(currentAllocated - totalAmount) > 0.01) {
             setError(`Total Amount (₹${totalAmount}) does not match Allocated Amount (₹${currentAllocated}).`)
             return
        }

        const validAllocations = invoices.filter(inv => inv.amountApplied > 0).map(inv => ({
             invoiceId: inv.id,
             amountApplied: inv.amountApplied
        }))

        if (validAllocations.length === 0) {
             setError("No amount has been allocated to any invoice.")
             return
        }

        setLoading(true)
        try {
            const result = await createPaymentIn({
                partyId,
                paymentDate: new Date(paymentDate),
                totalAmount,
                modes,
                notes: notes || undefined,
                allocations: validAllocations,
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
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/payments")}
                        className="text-muted-foreground hover:text-foreground hover:bg-border h-9 w-9 p-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <CreditCard size={20} className="text-emerald-400" />
                            Record Payment Received
                        </h1>
                        <p className="text-sm text-muted-foreground">Log money received from a customer</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                    {loading ? (
                        <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</>
                    ) : (
                        <><Save size={16} className="mr-2" /> Save Payment Details</>
                    )}
                </Button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Payment Details</h3>
                        
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Customer *</Label>
                            <Select value={partyId} onValueChange={handleCustomerChange}>
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

                {/* Right Column: Invoice Allocation Array */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-xl overflow-hidden min-h-[400px] flex flex-col">
                        <div className="p-5 flex items-center justify-between border-b border-border bg-muted/50">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Outstanding Invoices</h3>
                                <p className="text-xs text-muted-foreground mt-1">Allocate the received amount across pending bills.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                 {invoices.length > 0 && totalAmount > 0 && (
                                     <Button 
                                        variant="outline" 
                                        onClick={handleAutoAllocate}
                                        className="h-8 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                     >
                                         Auto Allocate Oldest
                                     </Button>
                                 )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto p-4">
                            {fetchingInvoices ? (
                                <div className="flex flex-col items-center justify-center p-12 h-full text-muted-foreground">
                                    <Loader2 className="animate-spin mb-4" size={32} />
                                    Loading Invoices...
                                </div>
                            ) : invoices.length === 0 && partyId ? (
                                <div className="flex flex-col items-center justify-center p-12 h-full text-muted-foreground">
                                    <Search className="mb-4 text-muted-foreground" size={32} />
                                    No outstanding invoices found for this customer.
                                </div>
                            ) : invoices.length === 0 && !partyId ? (
                                <div className="flex flex-col items-center justify-center p-12 h-full text-muted-foreground">
                                    <CreditCard className="mb-4 text-muted-foreground" size={32} />
                                    Select a customer to view pending invoices.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-muted-foreground text-xs">Invoice #</TableHead>
                                            <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                                            <TableHead className="text-muted-foreground text-xs text-right">Bill Total</TableHead>
                                            <TableHead className="text-muted-foreground text-xs text-right">Balance</TableHead>
                                            <TableHead className="text-muted-foreground text-xs text-right w-40">Payment Applied</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((inv, idx) => (
                                            <TableRow key={inv.id} className="border-border hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium text-foreground text-sm">
                                                    {inv.invoiceNumber}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {format(new Date(inv.invoiceDate), "dd MMM yy")}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground text-sm">
                                                    {formatCurrency(inv.grandTotal)}
                                                </TableCell>
                                                <TableCell className="text-right text-rose-400 font-medium text-sm">
                                                    {formatCurrency(inv.balanceDue)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        max={inv.balanceDue}
                                                        value={inv.amountApplied || ""}
                                                        onChange={(e) => handleAllocationChange(idx, e.target.value)}
                                                        className={`bg-background border text-right pr-3 h-8 ${
                                                            inv.amountApplied > 0 
                                                            ? 'border-emerald-500/50 text-emerald-400 font-bold bg-emerald-500/5' 
                                                            : 'border-border text-foreground'
                                                        }`}
                                                        placeholder="0.00"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        <Separator className="bg-border" />

                        <div className="p-5 bg-background flex items-center justify-between text-sm">
                             <div className="flex gap-8">
                                  <div>
                                       <span className="text-muted-foreground text-xs block mb-1">Total Outstanding</span>
                                       <span className="text-primary font-semibold">{formatCurrency(totalOutstanding)}</span>
                                  </div>
                             </div>
                             
                             <div className="flex items-center gap-6">
                                  <div className="text-right">
                                       <span className="text-muted-foreground text-xs block mb-1">Total Received</span>
                                       <span className="text-emerald-400 font-bold">{formatCurrency(totalAmount)}</span>
                                  </div>
                                  <div className="text-right">
                                       <span className="text-muted-foreground text-xs block mb-1">Total Allocated</span>
                                       <span className={`font-bold ${Math.abs(currentAllocated - totalAmount) > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                           {formatCurrency(currentAllocated)}
                                       </span>
                                  </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
