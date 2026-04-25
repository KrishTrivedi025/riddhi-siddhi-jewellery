import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { getItems, getCategories, getStockSummary } from "@/lib/actions/items"
import { InventoryContent } from "@/components/inventory/inventory-content"
import { Skeleton } from "@/components/ui/skeleton"

export default async function InventoryPage() {
    return (
        <PageWrapper className="space-y-8">
            <Suspense fallback={<InventorySkeleton />}>
                <InventoryData />
            </Suspense>
        </PageWrapper>
    )
}

async function InventoryData() {
    const [allItems, categories, stockSummary] = await Promise.all([
        getItems(),
        getCategories(),
        getStockSummary(),
    ])

    return (
        <InventoryContent
            items={allItems}
            categories={categories}
        />
    )
}

function InventorySkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-40 bg-muted" />
                    <Skeleton className="h-4 w-60 mt-2 bg-muted" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-28 bg-muted" />
                    <Skeleton className="h-10 w-28 bg-muted" />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-24 bg-muted rounded-xl" />
                <Skeleton className="h-24 bg-muted rounded-xl" />
                <Skeleton className="h-24 bg-muted rounded-xl" />
                <Skeleton className="h-24 bg-muted rounded-xl" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-28 bg-muted rounded-lg" />
                <Skeleton className="h-9 w-28 bg-muted rounded-lg" />
                <Skeleton className="h-9 w-32 bg-muted rounded-lg" />
            </div>
            <Skeleton className="h-[400px] w-full bg-muted rounded-xl border border-border" />
        </div>
    )
}
