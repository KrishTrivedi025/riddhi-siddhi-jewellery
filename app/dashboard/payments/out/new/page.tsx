import { Suspense } from "react"
import { getSuppliersWithBalances } from "@/lib/actions/payments-out"
import { PaymentOutForm } from "@/components/payments/payment-out-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
    title: "Record Payment Made | Riddhi Siddhi Jewellery",
    description: "Record payments made to suppliers against purchase invoices",
}

export default async function NewPaymentOutPage() {
    return (
        <div className="space-y-8">
            <Suspense fallback={<PaymentOutFormSkeleton />}>
                <PaymentOutFormData />
            </Suspense>
        </div>
    )
}

async function PaymentOutFormData() {
    const suppliers = await getSuppliersWithBalances()
    return <PaymentOutForm suppliers={suppliers} />
}

function PaymentOutFormSkeleton() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 bg-card" />
                    <div>
                        <Skeleton className="h-6 w-48 bg-card" />
                        <Skeleton className="h-4 w-64 mt-2 bg-card" />
                    </div>
                </div>
                <Skeleton className="h-10 w-40 bg-card" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-1 h-[500px] bg-card rounded-xl border border-border" />
                <Skeleton className="lg:col-span-2 h-[500px] bg-card rounded-xl border border-border" />
            </div>
        </div>
    )
}
