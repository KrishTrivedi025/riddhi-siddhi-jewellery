import { Suspense } from "react"
import { getPurchaseInvoicesForReturn } from "@/lib/actions/purchase-returns"
import { PurchaseReturnForm } from "@/components/purchases/return-form"
import { Skeleton } from "@/components/ui/skeleton"

export default async function NewPurchaseReturnPage() {
    return (
        <Suspense fallback={<FormSkeleton />}>
            <PurchaseReturnData />
        </Suspense>
    )
}

async function PurchaseReturnData() {
    const invoices = await getPurchaseInvoicesForReturn()
    return <PurchaseReturnForm invoices={invoices} />
}

function FormSkeleton() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48 bg-card" />
                <Skeleton className="h-10 w-32 bg-card" />
            </div>
            <Skeleton className="h-[200px] w-full bg-card rounded-xl border border-border" />
        </div>
    )
}
