import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { getPurchaseInvoices } from "@/lib/actions/purchases"
import { getPurchaseReturns } from "@/lib/actions/purchase-returns"
import { PurchasesContent } from "@/components/purchases/purchases-content"
import { Skeleton } from "@/components/ui/skeleton"

export default async function PurchasesPage() {
    return (
        <PageWrapper className="space-y-8">
            <Suspense fallback={<PurchasesSkeleton />}>
                <PurchasesData />
            </Suspense>
        </PageWrapper>
    )
}

async function PurchasesData() {
    const invoices = await getPurchaseInvoices()
    const returns = await getPurchaseReturns()
    return <PurchasesContent invoices={invoices} returns={returns} />
}

function PurchasesSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-32 bg-muted" />
                    <Skeleton className="h-4 w-60 mt-2 bg-muted" />
                </div>
                <Skeleton className="h-10 w-32 bg-muted" />
            </div>
            <Skeleton className="h-[400px] w-full bg-muted rounded-xl border border-border" />
        </div>
    )
}
