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
import { Switch } from "@/components/ui/switch"
import { createQuickSupplier } from "@/lib/actions/supplier-transactions"
import { quickSupplierSchema, type QuickSupplierFormValues } from "@/lib/schemas/supplier-transaction-schema"

interface QuickSupplierDialogProps {
    trigger: React.ReactNode
}

export function QuickSupplierDialog({ trigger }: QuickSupplierDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<QuickSupplierFormValues>({
        resolver: zodResolver(quickSupplierSchema),
        defaultValues: { name: "", phone: "", isWorker: false },
    })

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = form

    const isWorker = watch("isWorker")

    const onSubmit = async (values: QuickSupplierFormValues) => {
        const result = await createQuickSupplier(values)
        if (result.success) {
            toast.success(values.isWorker ? "Worker added" : "Supplier added")
            reset()
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
                if (!next) reset()
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground w-[95vw] max-w-sm rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Add Supplier</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="supplier-name">Party name</Label>
                        <Input
                            id="supplier-name"
                            placeholder="Party name"
                            autoFocus
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="supplier-phone">Mobile Number (optional)</Label>
                        <Input
                            id="supplier-phone"
                            placeholder="Mobile Number"
                            inputMode="tel"
                            {...register("phone")}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                        <Label htmlFor="supplier-is-worker" className="cursor-pointer">
                            This is a Worker
                        </Label>
                        <Switch
                            id="supplier-is-worker"
                            checked={isWorker}
                            onCheckedChange={(checked) => setValue("isWorker", checked, { shouldDirty: true })}
                            className="data-[state=unchecked]:bg-white! data-[state=checked]:bg-rose-600!"
                        />
                    </div>

                    {isWorker && (
                        <div className="space-y-1.5">
                            <Label htmlFor="worker-monthly-salary">Monthly Salary</Label>
                            <Input
                                id="worker-monthly-salary"
                                type="number"
                                inputMode="decimal"
                                placeholder="e.g. 12000"
                                {...register("monthlySalary", { valueAsNumber: true })}
                            />
                            {errors.monthlySalary && (
                                <p className="text-xs text-destructive">{errors.monthlySalary.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Per-day rate is calculated automatically — salary ÷ days in the month.
                            </p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                        {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : isWorker ? (
                            "ADD WORKER"
                        ) : (
                            "ADD SUPPLIER"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
