"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BankForm } from "./bank-form"
import { useState } from "react"
import { BankAccountFormValues } from "@/lib/schemas/bank-schema"

interface BankDialogProps {
    initialData?: BankAccountFormValues & { id?: string }
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function BankDialog({ initialData, trigger, onSuccess }: BankDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                        <Plus className="mr-2 h-4 w-4" /> Add Account
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-foreground">
                        {initialData?.id ? "Edit Account" : "Add New Account"}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <BankForm 
                        initialData={initialData} 
                        onSuccess={() => {
                            setOpen(false)
                            onSuccess?.()
                        }} 
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
