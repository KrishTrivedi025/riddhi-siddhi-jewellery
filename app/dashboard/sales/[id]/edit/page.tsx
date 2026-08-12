import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { getSaleInvoiceById, getBusinessProfile } from "@/lib/actions/sales"
import { getItems } from "@/lib/actions/items"
import { prisma } from "@/lib/db"
import { InvoiceForm } from "@/components/sales/invoice-form"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

interface EditInvoicePageProps {
    params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
    const { id } = await params
    return (
        <Suspense fallback={<EditInvoiceSkeleton />}>
            <EditInvoiceData id={id} />
        </Suspense>
    )
}

async function EditInvoiceData({ id }: { id: string }) {
    const session = await auth()
    if (!session?.user?.id) return null

    const invoice = await getSaleInvoiceById(id)
    if (!invoice) notFound()
    if (invoice.status === "cancelled" || invoice.paymentStatus !== "unpaid") {
        redirect(`/dashboard/sales/${id}`)
    }

    const [businessProfile, items, parties] = await Promise.all([
        getBusinessProfile(),
        getItems(),
        prisma.party.findMany({
            where: { deletedAt: null, partyType: "CUSTOMER", userId: session.user.id },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                state: true,
                gstin: true,
                billingAddress: true,
                city: true,
                pincode: true,
                phone: true,
                email: true,
            },
        }),
    ])

    return (
        <InvoiceForm
            invoiceId={invoice.id}
            nextInvoiceNumber={invoice.invoiceNumber}
            parties={parties}
            items={items}
            businessProfile={businessProfile}
            isGst={invoice.isGst}
            initialData={invoice}
        />
    )
}

function EditInvoiceSkeleton() {
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
