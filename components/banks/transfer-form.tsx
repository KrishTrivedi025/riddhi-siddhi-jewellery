"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, ArrowRightLeft, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TransferFormValues, transferSchema } from "@/lib/schemas/bank-schema"
import { createTransfer } from "@/lib/actions/transfers"
import { getBankAccounts } from "@/lib/actions/banks"
import { toast } from "sonner"
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
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TransferFormProps {
    onSuccess: () => void
}

export function TransferForm({ onSuccess }: TransferFormProps) {
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])

    const form = useForm<TransferFormValues>({
        // @ts-ignore
        resolver: zodResolver(transferSchema),
        defaultValues: {
            fromAccountId: "",
            toAccountId: "",
            amount: 0,
            transferDate: new Date(),
            notes: "",
        },
    })

    const { register, handleSubmit, setValue, watch, formState: { errors } } = form
    const fromAccountId = watch("fromAccountId")
    const toAccountId = watch("toAccountId")
    const transferDate = watch("transferDate")

    useEffect(() => {
        getBankAccounts().then(setAccounts).catch(() => toast.error("Failed to load accounts"))
    }, [])

    async function onSubmit(values: TransferFormValues) {
        setLoading(true)
        try {
            const result = await createTransfer(values)
            if (result.success) {
                toast.success("Transfer completed successfully")
                onSuccess()
            } else {
                toast.error(result.error || "Something went wrong")
            }
        } catch (error) {
            toast.error("Failed to complete transfer")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4">
                <div className="flex items-center gap-4">
                    {/* From Account */}
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">From Account</Label>
                        <Select onValueChange={(val) => setValue("fromAccountId", val)} value={fromAccountId}>
                            <SelectTrigger className="bg-background border-border text-foreground h-11 focus:border-primary transition-all">
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id} disabled={acc.id === toAccountId}>
                                        {acc.isCash ? "Cash" : acc.accountName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.fromAccountId && <p className="text-[10px] text-rose-500 ml-1">{errors.fromAccountId.message}</p>}
                    </div>

                    <div className="mt-6 text-primary animate-pulse">
                        <ArrowRightLeft size={20} />
                    </div>

                    {/* To Account */}
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">To Account</Label>
                        <Select onValueChange={(val) => setValue("toAccountId", val)} value={toAccountId}>
                            <SelectTrigger className="bg-background border-border text-foreground h-11 focus:border-primary transition-all">
                                <SelectValue placeholder="Destination" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                                        {acc.isCash ? "Cash" : acc.accountName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.toAccountId && <p className="text-[10px] text-rose-500 ml-1">{errors.toAccountId.message}</p>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Transfer Amount (₹) *</Label>
                    <Input 
                        type="text"
                        value={watch("amount") >= 10 ? watch("amount") : (watch("amount") || 0).toString().padStart(2, '0')}
                        onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = "" }}
                        onBlur={(e) => {
                            if (e.target.value === "") setValue("amount", 0)
                            else setValue("amount", parseFloat(e.target.value) || 0)
                        }}
                        onChange={(e) => setValue("amount", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="bg-background border-border text-foreground h-11 text-lg font-bold focus:border-primary transition-all"
                    />
                    {errors.amount && <p className="text-[10px] text-rose-500 ml-1">{errors.amount.message}</p>}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Transfer Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-background border-border text-foreground h-11 hover:border-primary transition-all",
                                    !transferDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                {transferDate ? format(transferDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border">
                            <Calendar
                                mode="single"
                                selected={transferDate}
                                onSelect={(date) => date && setValue("transferDate", date)}
                                initialFocus
                                className="bg-card text-foreground"
                            />
                        </PopoverContent>
                    </Popover>
                    {errors.transferDate && <p className="text-[10px] text-rose-500 ml-1">{errors.transferDate.message}</p>}
                </div>

                {/* Notes */}
                <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Notes / Remarks (Optional)</Label>
                    <Input 
                        {...register("notes")} 
                        placeholder="Reference or reason for transfer"
                        className="bg-background border-border text-foreground h-11 focus:border-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-12 shadow-lg shadow-primary/20"
                >
                    {loading ? (
                        <><Loader2 className="mr-2 animate-spin" size={16} /> Processing...</>
                    ) : (
                        "Complete Transfer"
                    )}
                </Button>
            </div>
        </form>
    )
}
