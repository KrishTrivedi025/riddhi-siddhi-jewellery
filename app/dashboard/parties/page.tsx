import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { getParties } from "@/lib/actions/parties"
import { PartiesContent } from "@/components/parties/parties-content"
import { Skeleton } from "@/components/ui/skeleton"

export default async function PartiesPage() {
    return (
        <PageWrapper className="space-y-8">
            <Suspense fallback={<PartiesListSkeleton />}>
                <PartiesData />
            </Suspense>
        </PageWrapper>
    )
}

async function PartiesData() {
    const customers = await getParties("CUSTOMER")
    const suppliers = await getParties("SUPPLIER")

    return <PartiesContent customers={customers} suppliers={suppliers} />
}

function PartiesListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-32 bg-muted" />
                    <Skeleton className="h-4 w-56 mt-2 bg-muted" />
                </div>
                <Skeleton className="h-10 w-28 bg-muted" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-32 bg-muted rounded-lg" />
                <Skeleton className="h-9 w-32 bg-muted rounded-lg" />
            </div>
            <Skeleton className="h-[400px] w-full bg-muted rounded-xl border border-border" />
        </div>
    )
}
