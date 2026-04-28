"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { PartyForm } from "./party-form"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface PartyDialogProps {
    initialData?: any
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function PartyDialog({ initialData, trigger, onSuccess }: PartyDialogProps) {
    const [open, setOpen] = useState(false)

    const handleSuccess = () => {
        setOpen(false)
        onSuccess?.()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                        <Plus size={16} />
                        Add Party
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground w-[95vw] max-w-lg sm:max-w-xl rounded-2xl p-0 overflow-hidden gap-0">
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
                    <DialogTitle className="text-lg font-bold">{initialData ? "Edit Party" : "Add New Party"}</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[80vh]">
                    <PartyForm 
                        initialData={initialData} 
                        onSuccess={handleSuccess} 
                        onCancel={() => setOpen(false)} 
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
