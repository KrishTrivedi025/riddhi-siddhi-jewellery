"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setWorkerRate } from "@/lib/actions/workers"
import { workerRateSchema, type WorkerRateFormValues } from "@/lib/schemas/worker-schema"

interface WorkerRateDialogProps {
    partyId: string
    monthlySalary: number
    dailyDeduction: number
    trigger: React.ReactNode
}

export function WorkerRateDialog({ partyId, monthlySalary, dailyDeduction, trigger }: WorkerRateDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<WorkerRateFormValues>({
        resolver: zodResolver(workerRateSchema),
        defaultValues: { monthlySalary },
    })

    const onSubmit = async (values: WorkerRateFormValues) => {
        const result = await setWorkerRate(partyId, values)
        if (result.success) {
            toast.success("Rate updated")
            setOpen(false)
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) reset({ monthlySalary })
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground w-[95vw] max-w-sm rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Edit Monthly Salary</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="worker-salary">Monthly Salary</Label>
                        <Input
                            id="worker-salary"
                            type="number"
                            inputMode="decimal"
                            {...register("monthlySalary", { valueAsNumber: true })}
                        />
                        {errors.monthlySalary && (
                            <p className="text-xs text-destructive">{errors.monthlySalary.message}</p>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Per-day rate (currently ₹{dailyDeduction.toLocaleString("en-IN", { maximumFractionDigits: 2 })}/day)
                        is calculated automatically — salary ÷ days in that month. Changes apply from this month
                        onward; past months keep their original rate.
                    </p>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "SAVE"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
