import { Skeleton } from "@/components/ui/skeleton"

/**
 * RecentTransactionsSkeleton — exactly matches the shape of the
 * RecentTransactions card (header, 5 rows, footer) to prevent
 * any layout shift when real data arrives.
 */
export function RecentTransactionsSkeleton() {
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            {/* Header row */}
            <div className="p-5 border-b border-border flex items-center justify-between">
                <Skeleton className="h-5 w-36 rounded-lg" />
                <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-md" />
                    <Skeleton className="w-6 h-3 rounded-md" />
                    <Skeleton className="w-6 h-6 rounded-md" />
                </div>
            </div>

            {/* Transaction rows */}
            <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-3">
                        {/* Avatar */}
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />

                        {/* Party name + ref */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <Skeleton className="h-3.5 w-28 rounded-md" />
                            <Skeleton className="h-2.5 w-16 rounded-md" />
                        </div>

                        {/* Amount + status */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Skeleton className="h-3.5 w-14 rounded-md" />
                            <Skeleton className="h-2.5 w-10 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-center">
                <Skeleton className="h-3.5 w-24 rounded-md" />
            </div>
        </div>
    )
}
