import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getPaymentInById } from "@/lib/actions/payments-in"
import { PaymentInForm } from "@/components/payments/payment-in-form"
import { Skeleton } from "@/components/ui/skeleton"

interface EditPaymentInPageProps {
    params: Promise<{ id: string }>
}

export default async function EditPaymentInPage({ params }: EditPaymentInPageProps) {
    const { id } = await params
    return (
        <Suspense fallback={<FormSkeleton />}>
            <EditPaymentInData id={id} />
        </Suspense>
    )
}

async function EditPaymentInData({ id }: { id: string }) {
    const payment = await getPaymentInById(id)
    if (!payment) notFound()

    return <PaymentInForm customers={[]} paymentId={payment.id} initialData={payment} />
}

function FormSkeleton() {
    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48 bg-card" />
            </div>
            <Skeleton className="h-[500px] bg-card rounded-xl border border-border" />
        </div>
    )
}
