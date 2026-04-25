"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft } from "lucide-react"
import { TransferForm } from "./transfer-form"
import { useState } from "react"

export function TransferDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ArrowRightLeft className="text-primary" size={20} />
                        Inter-Account Transfer
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <TransferForm onSuccess={() => setOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
