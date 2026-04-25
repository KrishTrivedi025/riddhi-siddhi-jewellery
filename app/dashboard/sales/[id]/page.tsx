import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getSaleInvoiceById, getBusinessProfile } from "@/lib/actions/sales"
import { InvoiceDetail } from "@/components/sales/invoice-detail"
import { Skeleton } from "@/components/ui/skeleton"

interface InvoiceDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
    const { id } = await params
    return (
        <Suspense fallback={<DetailSkeleton />}>
            <InvoiceDetailData id={id} />
        </Suspense>
    )
}

async function InvoiceDetailData({ id }: { id: string }) {
    const [invoice, businessProfile] = await Promise.all([
        getSaleInvoiceById(id),
        getBusinessProfile(),
    ])

    if (!invoice) notFound()

    return <InvoiceDetail invoice={invoice} businessProfile={businessProfile} />
}

function DetailSkeleton() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 bg-card rounded-lg" />
                    <div>
                        <Skeleton className="h-6 w-40 bg-card" />
                        <Skeleton className="h-4 w-56 mt-2 bg-card" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24 bg-card" />
                    <Skeleton className="h-10 w-28 bg-card" />
                </div>
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-6 w-16 bg-card rounded-full" />
                <Skeleton className="h-6 w-16 bg-card rounded-full" />
            </div>
            <Skeleton className="h-[600px] w-full bg-card rounded-xl border border-border" />
        </div>
    )
}
