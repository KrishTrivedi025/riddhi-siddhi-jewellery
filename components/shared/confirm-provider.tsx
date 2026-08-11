"use client"

import { createContext, useCallback, useContext, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmOptions {
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
}

interface ConfirmState extends ConfirmOptions {
    resolve: (value: boolean) => void
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ConfirmState | null>(null)

    const confirm = useCallback<ConfirmFn>((options) => {
        return new Promise((resolve) => setState({ ...options, resolve }))
    }, [])

    const close = (result: boolean) => {
        state?.resolve(result)
        setState(null)
    }

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <AlertDialog open={!!state} onOpenChange={(open) => { if (!open) close(false) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{state?.title}</AlertDialogTitle>
                        {state?.description && (
                            <AlertDialogDescription>{state.description}</AlertDialogDescription>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => close(false)}>
                            {state?.cancelText || "Cancel"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => close(true)}
                            className={
                                state?.variant === "destructive"
                                    ? "bg-rose-600 text-white hover:bg-rose-600/90"
                                    : undefined
                            }
                        >
                            {state?.confirmText || "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    )
}

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext)
    if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider")
    return ctx
}
