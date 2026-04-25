import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft } from "lucide-react"

export default function AccountDetailLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header / Breadcrumb Skeleton */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>

            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                ))}
            </div>

            {/* Transactions Table Skeleton */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="p-0">
                    <div className="space-y-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
