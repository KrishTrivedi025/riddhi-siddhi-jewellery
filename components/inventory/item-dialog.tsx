"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ItemForm } from "./item-form"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ItemDialogProps {
    initialData?: any
    categories: any[]
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function ItemDialog({ initialData, categories, trigger, onSuccess }: ItemDialogProps) {
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
                        Add Item
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Item" : "Add New Item"}</DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                    <ItemForm
                        initialData={initialData}
                        categories={categories}
                        onSuccess={handleSuccess}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
