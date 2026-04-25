import { Suspense } from "react"
import { getCustomersWithBalances } from "@/lib/actions/payments-in"
import { PaymentInForm } from "@/components/payments/payment-in-form"
import { Skeleton } from "@/components/ui/skeleton"

export default async function NewPaymentInPage() {
    return (
        <Suspense fallback={<FormSkeleton />}>
            <PaymentInData />
        </Suspense>
    )
}

async function PaymentInData() {
    const customers = await getCustomersWithBalances()
    return <PaymentInForm customers={customers} />
}

function FormSkeleton() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48 bg-card" />
                <Skeleton className="h-10 w-32 bg-card" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-1 h-[400px] bg-card rounded-xl border border-border" />
                <Skeleton className="lg:col-span-2 h-[400px] bg-card rounded-xl border border-border" />
            </div>
        </div>
    )
}
