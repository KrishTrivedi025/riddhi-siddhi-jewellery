import { Suspense } from "react"
import { getInvoicesForReturn } from "@/lib/actions/sales"
import { ReturnForm } from "@/components/sales/return-form"
import { Skeleton } from "@/components/ui/skeleton"

export default async function NewReturnPage() {
    return (
        <Suspense fallback={<ReturnSkeleton />}>
            <ReturnData />
        </Suspense>
    )
}

async function ReturnData() {
    const invoices = await getInvoicesForReturn()
    return <ReturnForm invoices={invoices} />
}

function ReturnSkeleton() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 bg-card rounded-lg" />
                    <div>
                        <Skeleton className="h-6 w-48 bg-card" />
                        <Skeleton className="h-4 w-64 mt-2 bg-card" />
                    </div>
                </div>
                <Skeleton className="h-10 w-36 bg-card" />
            </div>
            <Skeleton className="h-[200px] w-full bg-card rounded-xl" />
            <Skeleton className="h-[400px] w-full bg-card rounded-xl" />
        </div>
    )
}
