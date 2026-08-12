"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { partySchema, PartyFormValues } from "@/lib/schemas/party-schema"
import { createParty, updateParty } from "@/lib/actions/parties"
import { getGSTDetails } from "@/lib/actions/gst"
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
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useTrackDirty } from "@/lib/hooks/use-unsaved-changes"

interface PartyFormProps {
    initialData?: any
    onSuccess: () => void
    onCancel: () => void
}

export function PartyForm({ initialData, onSuccess, onCancel }: PartyFormProps) {
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [gstStatus, setGstStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

    const form = useForm<PartyFormValues>({
        // @ts-ignore - Bridging Zod inference and RHF 7.x strict typing
        resolver: zodResolver(partySchema),
        defaultValues: {
            partyType: initialData?.partyType || "CUSTOMER",
            name: initialData?.name || "",
            contactPerson: initialData?.contactPerson || "",
            phone: initialData?.phone || "",
            email: initialData?.email || "",
            gstin: initialData?.gstin || "",
            pan: initialData?.pan || "",
            billingAddress: initialData?.billingAddress || "",
            shippingAddress: initialData?.shippingAddress || "",
            city: initialData?.city || "",
            state: initialData?.state || "",
            pincode: initialData?.pincode || "",
            openingBalance: initialData?.openingBalance || 0,
            balanceType: initialData?.balanceType || "debit",
            creditLimit: initialData?.creditLimit || 0,
            paymentTerms: initialData?.paymentTerms || "",
            notes: initialData?.notes || "",
            priceMultiplier: initialData?.priceMultiplier ?? 1,
        }
    })

    const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = form

    useTrackDirty(isDirty)

    const partyType = watch("partyType")
    const balanceType = watch("balanceType")
    const gstinValue = watch("gstin")

    const handleVerifyGST = async () => {
        if (!gstinValue || gstinValue.length < 15) return

        setVerifying(true)
        setGstStatus(null)
        try {
            const result = await getGSTDetails(gstinValue)
            if (result.success && result.data) {
                setValue("name", result.data.name)
                setValue("billingAddress", result.data.address || "")
                setValue("city", result.data.city || "")
                setValue("state", result.data.state || "")
                setValue("pincode", result.data.pincode || "")
                if (result.data.email) setValue("email", result.data.email)
                
                const successMsg = result.data.isContactRestricted 
                    ? "GST details fetched (Contacts restricted by Gov)" 
                    : "GST details fetched successfully!"
                
                setGstStatus({ type: "success", message: successMsg })
            } else {
                setGstStatus({ type: "error", message: result.error || "Invalid GSTIN" })
            }
        } catch (error) {
            setGstStatus({ type: "error", message: "Verification failed" })
        } finally {
            setVerifying(false)
        }
    }

    const onSubmit = async (data: PartyFormValues) => {
        setLoading(true)
        try {
            if (initialData?.id) {
                await updateParty(initialData.id, data)
            } else {
                await createParty(data)
            }
            onSuccess()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5 px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Party Type</Label>
                    <Select 
                        onValueChange={(val) => setValue("partyType", val as any)}
                        defaultValue={partyType}
                    >
                        <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                            <SelectItem value="SUPPLIER">Supplier</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-muted-foreground">GSTIN (Optional)</Label>
                    <div className="flex gap-2">
                        <Input 
                            {...register("gstin")}
                            placeholder="22AAAAA0000A1Z5"
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                        <Button 
                            type="button"
                            onClick={handleVerifyGST}
                            disabled={verifying || !gstinValue || gstinValue.length < 15}
                            className="bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all px-3 shrink-0"
                        >
                            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                        </Button>
                    </div>
                    {gstStatus && (
                        <p className={`text-[10px] flex items-center gap-1 ${gstStatus.type === "success" ? "text-emerald-500" : "text-rose-500"}`}>
                            {gstStatus.type === "success" ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                            {gstStatus.message}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground">Party Name</Label>
                <Input 
                    {...register("name")}
                    placeholder="Enter name"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <Input 
                        {...register("phone")}
                        placeholder="10 digit number"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <Input 
                        {...register("email")}
                        placeholder="email@example.com"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            <Separator className="bg-border" />

            <div>
                <h4 className="text-sm font-medium text-foreground mb-4">Address Details</h4>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Billing Address</Label>
                        <Input 
                            {...register("billingAddress")}
                            className="bg-background border-border text-foreground"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">City</Label>
                            <Input {...register("city")} className="bg-background border-border text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">State</Label>
                            <Input {...register("state")} className="bg-background border-border text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Pincode</Label>
                            <Input {...register("pincode")} className="bg-background border-border text-foreground" />
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-border" />

            <div>
                <h4 className="text-sm font-medium text-foreground mb-4">Financials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Opening Balance</Label>
                        <Input 
                            type="number"
                            {...register("openingBalance", { valueAsNumber: true })}
                            className="bg-background border-border text-foreground"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Balance Type</Label>
                        <Select 
                            onValueChange={(val) => setValue("balanceType", val as any)}
                            defaultValue={balanceType}
                        >
                            <SelectTrigger className="bg-background border-border text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                                <SelectItem value="debit">To Receive (Debit)</SelectItem>
                                <SelectItem value="credit">To Pay (Credit)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {partyType === "CUSTOMER" && (
                    <div className="space-y-2 mt-4">
                        <Label className="text-muted-foreground">Price Multiplier</Label>
                        <Input
                            type="number"
                            step="0.01"
                            {...register("priceMultiplier", { valueAsNumber: true })}
                            className="bg-background border-border text-foreground max-w-[160px]"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            1 = no change. e.g. 1.05 = +5%, 0.95 = -5%. Applied silently to non-GST invoice prices only.
                        </p>
                        {errors.priceMultiplier && (
                            <p className="text-xs text-rose-500">{errors.priceMultiplier.message}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-2 pb-2 border-t border-border sticky bottom-0 bg-card mt-2">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={onCancel}
                    className="text-muted-foreground hover:text-foreground hover:bg-border"
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                    {loading ? "Saving..." : (initialData ? "Update Party" : "Save Party")}
                </Button>
            </div>
        </form>
    )
}
