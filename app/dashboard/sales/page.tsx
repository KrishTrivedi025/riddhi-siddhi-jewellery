import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { getSaleInvoices, getSaleReturns } from "@/lib/actions/sales"
import { SalesContent } from "@/components/sales/sales-content"
import { Skeleton } from "@/components/ui/skeleton"

export default async function SalesPage() {
    return (
        <PageWrapper className="space-y-8">
            <Suspense fallback={<SalesSkeleton />}>
                <SalesData />
            </Suspense>
        </PageWrapper>
    )
}

async function SalesData() {
    const [invoices, returns] = await Promise.all([
        getSaleInvoices(),
        getSaleReturns(),
    ])

    return <SalesContent invoices={invoices} returns={returns} />
}

function SalesSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-32 bg-muted" />
                    <Skeleton className="h-4 w-60 mt-2 bg-muted" />
                </div>
                <Skeleton className="h-10 w-32 bg-muted" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-36 bg-muted rounded-lg" />
                <Skeleton className="h-10 w-36 bg-muted rounded-lg" />
            </div>
            <Skeleton className="h-[400px] w-full bg-muted rounded-xl border border-border" />
        </div>
    )
}
