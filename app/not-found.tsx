import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center">
                <FileQuestion size={24} className="text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">Page not found</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                    The page you&apos;re looking for doesn&apos;t exist or was moved.
                </p>
            </div>
            <Button asChild className="mt-2">
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
        </div>
    )
}
