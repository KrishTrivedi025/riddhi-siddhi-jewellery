import { Skeleton } from "../ui/skeleton"

export function KPISkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="w-12 h-12 rounded-xl bg-border" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="w-24 h-4 bg-border" />
                        <Skeleton className="w-32 h-8 bg-border" />
                    </div>
                </div>
            ))}
        </div>
    )
}
