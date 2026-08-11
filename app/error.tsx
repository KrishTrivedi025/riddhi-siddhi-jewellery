"use client"

import { ErrorState } from "@/components/shared/error-state"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <ErrorState error={error} reset={reset} homeHref="/dashboard" />
        </div>
    )
}
