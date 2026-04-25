import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getPurchaseInvoiceById } from "@/lib/actions/purchases"
import { PurchaseDetail } from "@/components/purchases/purchase-detail"
import { Skeleton } from "@/components/ui/skeleton"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PurchaseDetailPage({ params }: PageProps) {
    const p = await params
    return (
        <Suspense fallback={<PurchaseDetailSkeleton />}>
            <PurchaseInvoiceData id={p.id} />
        </Suspense>
    )
}

async function PurchaseInvoiceData({ id }: { id: string }) {
    const invoice = await getPurchaseInvoiceById(id)

    if (!invoice) {
        notFound()
    }

    return <PurchaseDetail invoice={invoice} />
}

function PurchaseDetailSkeleton() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 bg-card rounded-lg" />
                    <div>
                        <Skeleton className="h-8 w-40 bg-card" />
                        <Skeleton className="h-4 w-32 mt-2 bg-card" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28 bg-card" />
                </div>
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-6 w-20 bg-card rounded-full" />
                <Skeleton className="h-6 w-20 bg-card rounded-full" />
            </div>
            <Skeleton className="h-[600px] w-full bg-card rounded-xl" />
        </div>
    )
}
