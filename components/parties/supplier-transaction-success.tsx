"use client"

import { Dialog as DialogPrimitive } from "radix-ui"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { spring } from "@/lib/animations"
import type { SupplierTransactionType } from "@/lib/actions/supplier-transactions"

interface SupplierTransactionSuccessProps {
    open: boolean
    partyName: string
    amount: number
    onAddAnother: (type: SupplierTransactionType) => void
    onDone: () => void
}

export function SupplierTransactionSuccess({
    open,
    partyName,
    amount,
    onAddAnother,
    onDone,
}: SupplierTransactionSuccessProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onDone() }}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                />
                <DialogPrimitive.Content
                    data-slot="dialog-content"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    className="fixed inset-0 z-50 bg-background flex flex-col outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                >
                    <DialogPrimitive.Title className="sr-only">Transaction saved</DialogPrimitive.Title>
                    <div
                        className="bg-emerald-600 text-white flex-1 flex flex-col items-center justify-center gap-4 px-6"
                        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
                    >
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={spring}
                            className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center"
                        >
                            <Check size={32} strokeWidth={3} />
                        </motion.div>
                        <p className="text-lg font-medium">Transaction saved</p>
                        <p className="text-3xl font-bold">₹{amount.toLocaleString("en-IN")}</p>
                    </div>

                    <div
                        className="p-5 space-y-4 border-t border-border"
                        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
                    >
                        <p className="text-sm text-center text-muted-foreground">
                            Add another transaction for {partyName}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => onAddAnother("GAVE")}
                                className="flex-1 bg-rose-600 hover:bg-rose-600/90 text-white font-bold"
                            >
                                YOU GAVE ₹
                            </Button>
                            <Button
                                onClick={() => onAddAnother("GOT")}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-600/90 text-white font-bold"
                            >
                                YOU GOT ₹
                            </Button>
                        </div>
                        <Button onClick={onDone} variant="outline" className="w-full">
                            DONE
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
