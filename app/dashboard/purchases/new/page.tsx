import { Suspense } from "react"
import { getNextPurchaseInvoiceNumber } from "@/lib/actions/purchases"
import { getItems } from "@/lib/actions/items"
import { getBusinessProfile } from "@/lib/actions/sales" // Can reuse getBusinessProfile
import { prisma } from "@/lib/db"
import { PurchaseInvoiceForm } from "@/components/purchases/purchase-form"
import { Skeleton } from "@/components/ui/skeleton"

export default async function NewPurchasePage() {
    return (
        <Suspense fallback={<NewPurchaseSkeleton />}>
            <NewPurchaseData />
        </Suspense>
    )
}

async function NewPurchaseData() {
    const [nextNumber, businessProfile, items, parties] = await Promise.all([
        getNextPurchaseInvoiceNumber(),
        getBusinessProfile(),
        getItems(),
        prisma.party.findMany({
            where: { deletedAt: null, partyType: "SUPPLIER" },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                state: true,
                gstin: true,
            },
        }),
    ])

    return (
        <PurchaseInvoiceForm
            nextInvoiceNumber={nextNumber}
            parties={parties}
            items={items}
            businessProfile={businessProfile}
        />
    )
}

function NewPurchaseSkeleton() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 bg-card rounded-lg" />
                    <div>
                        <Skeleton className="h-6 w-48 bg-card" />
                        <Skeleton className="h-4 w-32 mt-2 bg-card" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32 bg-card" />
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <Skeleton className="h-[200px] w-full bg-card rounded-xl" />
                    <Skeleton className="h-[300px] w-full bg-card rounded-xl" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full bg-card rounded-xl" />
                    <Skeleton className="h-[200px] w-full bg-card rounded-xl" />
                </div>
            </div>
        </div>
    )
}
