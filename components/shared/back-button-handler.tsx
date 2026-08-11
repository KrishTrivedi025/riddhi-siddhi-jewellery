"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { registerBackButton } from "@/lib/capacitor"
import { useConfirm } from "@/components/shared/confirm-provider"
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"

/** Radix Dialog/AlertDialog content is marked data-state="open" while visible. */
function hasOpenOverlay(): boolean {
    return !!document.querySelector(
        '[data-slot="dialog-content"][data-state="open"], [data-slot="alert-dialog-content"][data-state="open"]'
    )
}

/** Radix Dialog/AlertDialog close on Escape by default — reuse that instead of per-dialog wiring. */
function closeTopOverlay() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
}

/**
 * Mounted once in the dashboard shell. Makes the Android hardware back
 * button behave like an in-app back action instead of the WebView's raw
 * history navigation (which was silently discarding in-progress form data).
 */
export function BackButtonHandler() {
    const router = useRouter()
    const pathname = usePathname()
    const confirm = useConfirm()
    const { isDirty } = useUnsavedChanges()

    useEffect(() => {
        return registerBackButton(async () => {
            const overlayOpen = hasOpenOverlay()

            if (isDirty()) {
                const ok = await confirm({
                    title: "Discard changes?",
                    description: "You have unsaved changes. Going back will lose them.",
                    confirmText: "Discard",
                    cancelText: "Keep Editing",
                    variant: "destructive",
                })
                if (!ok) return
            }

            if (overlayOpen) {
                closeTopOverlay()
                return
            }

            if (pathname === "/dashboard") {
                const { App } = await import("@capacitor/app")
                App.minimizeApp()
                return
            }

            router.back()
        })
    }, [pathname, router, confirm, isDirty])

    return null
}
