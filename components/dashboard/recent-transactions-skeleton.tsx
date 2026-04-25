import { Skeleton } from "@/components/ui/skeleton"

export function RecentTransactionsSkeleton() {
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border">
                <Skeleton className="h-6 w-40 bg-border" />
            </div>
            
            <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full bg-border" />
                        
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 bg-border" />
                            <Skeleton className="h-3 w-20 bg-border" />
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <Skeleton className="h-4 w-16 bg-border" />
                            <Skeleton className="h-3 w-12 bg-border" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
