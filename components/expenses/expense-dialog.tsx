"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, PencilLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ExpenseForm } from "./expense-form"
import { getBankAccounts } from "@/lib/actions/banks"

interface ExpenseDialogProps {
    accounts: Awaited<ReturnType<typeof getBankAccounts>>
    initialData?: any   // pass for edit mode
    trigger?: React.ReactNode
}

export function ExpenseDialog({ accounts, initialData, trigger }: ExpenseDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const isEdit = !!initialData

    function handleSuccess() {
        setOpen(false)
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button
                        className={
                            isEdit
                                ? "h-8 w-8 p-0 bg-transparent hover:bg-border text-muted-foreground hover:text-foreground"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-5 gap-2"
                        }
                        variant={isEdit ? "ghost" : "default"}
                        size={isEdit ? "sm" : "default"}
                    >
                        {isEdit ? <PencilLine size={15} /> : <><Plus size={16} /> Add Expense</>}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="bg-card border-border max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            💸
                        </div>
                        {isEdit ? "Edit Expense" : "Record New Expense"}
                    </DialogTitle>
                </DialogHeader>

                <ExpenseForm
                    initialData={initialData}
                    accounts={accounts}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    )
}
