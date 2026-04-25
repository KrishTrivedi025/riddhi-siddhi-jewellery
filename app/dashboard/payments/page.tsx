import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { getPaymentsIn } from "@/lib/actions/payments-in"
import { getPaymentsOut } from "@/lib/actions/payments-out"
import { PaymentsContent } from "@/components/payments/payments-content"
import { Skeleton } from "@/components/ui/skeleton"

export default async function PaymentsPage() {
    return (
        <PageWrapper className="space-y-8">
            <Suspense fallback={<PaymentsSkeleton />}>
                <PaymentsData />
            </Suspense>
        </PageWrapper>
    )
}

async function PaymentsData() {
    const [paymentsIn, paymentsOut] = await Promise.all([
        getPaymentsIn(),
        getPaymentsOut(),
    ])
    return <PaymentsContent paymentsIn={paymentsIn} paymentsOut={paymentsOut} />
}

function PaymentsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-32 bg-muted" />
                    <Skeleton className="h-4 w-60 mt-2 bg-muted" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32 bg-muted" />
                    <Skeleton className="h-10 w-32 bg-muted" />
                </div>
            </div>
            <Skeleton className="h-[400px] w-full bg-muted rounded-xl border border-border" />
        </div>
    )
}
