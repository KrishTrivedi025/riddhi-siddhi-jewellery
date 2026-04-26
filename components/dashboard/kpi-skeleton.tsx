import { Skeleton } from "../ui/skeleton"

/**
 * KPISkeleton — matches the compact horizontal KPICard design.
 * Icon badge on left, label + value on right, same p-3 padding.
 */
export function KPISkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3"
                >
                    {/* Icon badge */}
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    {/* Label + value */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                        <Skeleton className="h-2.5 w-16 rounded" />
                        <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                </div>
            ))}
        </div>
    )
}
