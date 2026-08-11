"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
    error: Error & { digest?: string }
    reset: () => void
    homeHref?: string
}

export function ErrorState({ error, reset, homeHref = "/dashboard" }: ErrorStateProps) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-rose-500" />
            </div>
            <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                    {error.message || "An unexpected error occurred. Please try again."}
                </p>
            </div>
            <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={reset}>Try again</Button>
                <Button asChild>
                    <Link href={homeHref}>Go to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
