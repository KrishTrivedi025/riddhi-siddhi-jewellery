"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Landmark, Wallet, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BankAccountFormValues, bankAccountSchema } from "@/lib/schemas/bank-schema"
import { upsertBankAccount } from "@/lib/actions/banks"
import { toast } from "sonner"

interface BankFormProps {
    initialData?: any
    onSuccess: () => void
}

export function BankForm({ initialData, onSuccess }: BankFormProps) {
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)

    const form = useForm<BankAccountFormValues>({
        // @ts-ignore
        resolver: zodResolver(bankAccountSchema),
        defaultValues: initialData || {
            accountName: "",
            bankName: "",
            accountNumber: "",
            ifscCode: "",
            branchName: "",
            upiId: "",
            openingBalance: 0,
            isCash: false,
        },
    })

    const { register, handleSubmit, setValue, watch, formState: { errors } } = form
    const isCash = watch("isCash")
    const ifscCode = watch("ifscCode")

    const handleVerifyIFSC = async () => {
        if (!ifscCode || ifscCode.length < 11) {
            toast.error("Please enter a valid 11-digit IFSC code")
            return
        }

        setVerifying(true)
        try {
            const res = await fetch(`https://ifsc.razorpay.com/${ifscCode}`)
            if (res.ok) {
                const data = await res.json()
                setValue("bankName", data.BANK, { shouldValidate: true })
                setValue("branchName", data.BRANCH, { shouldValidate: true })
                toast.success("Bank details verified!")
            } else {
                toast.error("Invalid IFSC code or bank not found")
            }
        } catch (error) {
            toast.error("Verification failed. Please try again.")
        } finally {
            setVerifying(false)
        }
    }

    async function onSubmit(values: BankAccountFormValues) {
        setLoading(true)
        try {
            const result = await upsertBankAccount(values, initialData?.id)
            if (result.success) {
                toast.success(initialData?.id ? "Account updated" : "Account created")
                onSuccess()
            } else {
                toast.error(result.error || "Something went wrong")
            }
        } catch (error) {
            toast.error("Failed to save account")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            {/* Type Toggle */}
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isCash ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {isCash ? <Wallet size={20} /> : <Landmark size={20} />}
                    </div>
                    <div>
                        <Label className="text-foreground font-medium">Account Type</Label>
                        <p className="text-[10px] text-muted-foreground">{isCash ? 'Physical Cash Account' : 'Banking Institution Account'}</p>
                    </div>
                </div>
                <Switch
                    checked={isCash}
                    onCheckedChange={(val) => setValue("isCash", val)}
                    disabled={!!initialData?.id} // Cannot toggle type after creation
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Display Name *</Label>
                    <Input 
                        {...register("accountName")} 
                        placeholder={isCash ? "e.g. Counter Cash" : "e.g. SBI Current Account"} 
                        className="bg-background border-border text-foreground h-10 placeholder:text-muted-foreground"
                    />
                    {errors.accountName && <p className="text-xs text-rose-500">{errors.accountName.message}</p>}
                </div>

                {!isCash && (
                    <>
                        <div className="col-span-2 space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Bank Name</Label>
                            <Input {...register("bankName")} placeholder="Automatically filled on IFSC verification" className="bg-background border-border text-foreground h-10 placeholder:text-muted-foreground" />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Branch Name</Label>
                            <Input {...register("branchName")} placeholder="Automatically filled on IFSC verification" className="bg-background border-border text-foreground h-10 placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Account Number</Label>
                            <Input {...register("accountNumber")} className="bg-background border-border text-foreground h-10" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">IFSC Code</Label>
                            <div className="flex gap-2">
                                <Input 
                                    {...register("ifscCode")} 
                                    placeholder="e.g. SBIN0000691"
                                    className="bg-background border-border text-foreground h-10 placeholder:text-muted-foreground" 
                                />
                                <Button 
                                    type="button" 
                                    size="sm"
                                    onClick={handleVerifyIFSC}
                                    disabled={verifying}
                                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                >
                                    {verifying ? <Loader2 className="animate-spin h-4 w-4" /> : "Verify"}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                <div className="col-span-2 space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">UPI ID (Optional)</Label>
                    <Input 
                        {...register("upiId")} 
                        placeholder="e.g. business@upi"
                        className="bg-background border-border text-foreground h-10 placeholder:text-muted-foreground" 
                    />
                </div>

                {!initialData?.id && (
                    <div className="col-span-2 space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider text-primary">Opening Balance (₹)</Label>
                        <Input 
                            type="number" 
                            {...register("openingBalance", { valueAsNumber: true })} 
                            className="bg-card border-primary/20 text-emerald-400 font-bold h-10 text-lg" 
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-8"
                >
                    {loading ? (
                        <><Loader2 className="mr-2 animate-spin" size={16} /> Saving...</>
                    ) : (
                        "Save Account"
                    )}
                </Button>
            </div>
        </form>
    )
}
