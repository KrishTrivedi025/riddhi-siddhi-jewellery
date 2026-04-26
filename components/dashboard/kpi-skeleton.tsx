import { Skeleton } from "../ui/skeleton"

/**
 * KPISkeleton — matches the exact visual shape of KPICard.
 * Shows 8 placeholders in the same grid, so the layout
 * doesn't shift at all when real data loads.
 */
export function KPISkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-4 overflow-hidden"
                >
                    {/* Icon badge placeholder */}
                    <Skeleton className="w-10 h-10 md:w-11 md:h-11 rounded-xl" />

                    {/* Label + value placeholders */}
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-20 rounded-md" />
                        <Skeleton className="h-6 w-28 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    )
}
