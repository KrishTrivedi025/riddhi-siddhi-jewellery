"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Receipt, IndianRupee, Tag, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    expenseSchema,
    ExpenseFormValues,
    EXPENSE_CATEGORIES,
    EXPENSE_GST_RATES,
} from "@/lib/schemas/expense-schema"
import { upsertExpense } from "@/lib/actions/expenses"
import { getBankAccounts } from "@/lib/actions/banks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTrackDirty } from "@/lib/hooks/use-unsaved-changes"

interface ExpenseFormProps {
    initialData?: any
    accounts: Awaited<ReturnType<typeof getBankAccounts>>
    onSuccess: () => void
}

export function ExpenseForm({ initialData, accounts, onSuccess }: ExpenseFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: initialData
            ? {
                  expenseDate:   new Date(initialData.expenseDate),
                  category:      initialData.category,
                  description:   initialData.description || "",
                  amount:        initialData.amount,
                  gstRate:       initialData.gstRate,
                  gstAmount:     initialData.gstAmount,
                  bankAccountId: initialData.bankAccountId || "",
                  receiptUrl:    initialData.receiptUrl || "",
              }
            : {
                  expenseDate:   new Date(),
                  category:      "",
                  description:   "",
                  amount:        0,
                  gstRate:       0,
                  gstAmount:     0,
                  bankAccountId: "",
                  receiptUrl:    "",
              },
    })

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = form

    useTrackDirty(isDirty)

    const expenseDate = watch("expenseDate")
    const amount      = watch("amount") || 0
    const gstRate     = watch("gstRate") || 0

    // GST on expense is calculated as: (amount × rate / 100)
    // The amount entered is the base (pre-GST) amount
    const computedGst = parseFloat(((amount * gstRate) / 100).toFixed(2))

    async function onSubmit(values: ExpenseFormValues) {
        setLoading(true)
        try {
            const payload = { ...values, gstAmount: computedGst }
            const result = await upsertExpense(payload, initialData?.id)
            if (result.success) {
                toast.success(initialData?.id ? "Expense updated" : "Expense recorded")
                onSuccess()
            } else {
                toast.error(result.error || "Something went wrong")
            }
        } catch {
            toast.error("Failed to save expense")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Date + Category row */}
            <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarIcon size={11} /> Date *
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal h-10 bg-background border-border hover:bg-card hover:border-border",
                                    !expenseDate && "text-muted-foreground",
                                    expenseDate && "text-foreground"
                                )}
                            >
                                {expenseDate ? format(expenseDate, "dd MMM yyyy") : "Pick date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                            <Calendar
                                mode="single"
                                selected={expenseDate}
                                onSelect={(d) => d && setValue("expenseDate", d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {errors.expenseDate && (
                        <p className="text-xs text-rose-500">{errors.expenseDate.message}</p>
                    )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={11} /> Category *
                    </Label>
                    <Select
                        defaultValue={initialData?.category || ""}
                        onValueChange={(v) => setValue("category", v)}
                    >
                        <SelectTrigger className="h-10 bg-background border-border text-foreground">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <SelectItem
                                    key={cat}
                                    value={cat}
                                    className="text-foreground focus:bg-primary/10 focus:text-primary"
                                >
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.category && (
                        <p className="text-xs text-rose-500">{errors.category.message}</p>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={11} /> Description
                </Label>
                <Input
                    {...register("description")}
                    placeholder="e.g. Monthly shop rent – May 2026"
                    className="bg-background border-border text-foreground h-10 placeholder:text-muted-foreground"
                />
            </div>

            {/* Amount + GST Rate */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee size={11} /> Amount (₹) *
                    </Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("amount", { valueAsNumber: true })}
                        placeholder="0.00"
                        className="bg-background border-border text-foreground h-10 placeholder:text-muted-foreground font-mono"
                    />
                    {errors.amount && (
                        <p className="text-xs text-rose-500">{errors.amount.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                        GST Rate
                    </Label>
                    <Select
                        defaultValue={String(initialData?.gstRate ?? 0)}
                        onValueChange={(v) => setValue("gstRate", Number(v))}
                    >
                        <SelectTrigger className="h-10 bg-background border-border text-foreground">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                            {EXPENSE_GST_RATES.map((r) => (
                                <SelectItem
                                    key={r}
                                    value={String(r)}
                                    className="text-foreground focus:bg-primary/10 focus:text-primary"
                                >
                                    {r === 0 ? "No GST (0%)" : `${r}% GST`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* GST Amount (computed, read-only) */}
            {gstRate > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">GST Input Credit</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {amount.toFixed(2)} × {gstRate}% = claimable ITC
                        </p>
                    </div>
                    <p className="text-emerald-400 font-bold text-xl font-mono">
                        ₹{computedGst.toFixed(2)}
                    </p>
                </div>
            )}

            {/* Bank Account */}
            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={11} /> Paid From Account
                </Label>
                <Select
                    defaultValue={initialData?.bankAccountId || ""}
                    onValueChange={(v) => setValue("bankAccountId", v === "none" ? "" : v)}
                >
                    <SelectTrigger className="h-10 bg-background border-border text-foreground">
                        <SelectValue placeholder="Select account (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                        <SelectItem value="none" className="text-muted-foreground focus:bg-border">
                            — None —
                        </SelectItem>
                        {accounts.map((acc) => (
                            <SelectItem
                                key={acc.id}
                                value={acc.id}
                                className="text-foreground focus:bg-primary/10 focus:text-primary"
                            >
                                {acc.isCash ? "💵" : "🏦"} {acc.accountName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-background border border-border rounded-xl">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Base Amount</span>
                    <span className="font-mono text-foreground">₹{amount.toFixed(2)}</span>
                </div>
                {gstRate > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>GST ({gstRate}%)</span>
                        <span className="font-mono text-emerald-400">+ ₹{computedGst.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border">
                    <span className="text-foreground">Total Outflow</span>
                    <span className="font-mono text-primary text-lg">
                        ₹{(amount + computedGst).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-8"
                >
                    {loading ? (
                        <><Loader2 className="mr-2 animate-spin" size={16} /> Saving...</>
                    ) : initialData?.id ? (
                        "Update Expense"
                    ) : (
                        "Record Expense"
                    )}
                </Button>
            </div>
        </form>
    )
}
