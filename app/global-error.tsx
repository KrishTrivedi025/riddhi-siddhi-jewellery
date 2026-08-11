"use client"

import "./globals.css"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en" className="dark">
            <body className="bg-background text-foreground antialiased">
                <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <h2 className="text-lg font-semibold">Something went wrong</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        {error.message || "The app failed to load. Please try again."}
                    </p>
                    <button
                        onClick={reset}
                        className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
