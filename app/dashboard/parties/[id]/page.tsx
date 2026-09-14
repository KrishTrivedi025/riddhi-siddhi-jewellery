import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getPartyById, getPartyLedger, getPartyLedgerSummary } from "@/lib/actions/party-ledger"
import { getSupplierTransactions } from "@/lib/actions/supplier-transactions"
import { PartyHeader } from "@/components/parties/party-header"
import { PartyGstLedgerTabs } from "@/components/parties/party-gst-ledger-tabs"
import { SupplierKhataDetail } from "@/components/parties/supplier-khata-detail"
import { Skeleton } from "@/components/ui/skeleton"

interface PartyLedgerPageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PartyLedgerPageProps) {
    const { id } = await params
    const party = await getPartyById(id)
    return {
        title: party
            ? `${party.name} — Party Ledger | Riddhi Siddhi`
            : "Party Ledger",
    }
}

export default async function PartyLedgerPage({ params }: PartyLedgerPageProps) {
    const { id } = await params
    return (
        <div className="space-y-6 pb-8">
            <Suspense fallback={<HeaderSkeleton />}>
                <PartyLedgerContent id={id} />
            </Suspense>
        </div>
    )
}

async function PartyLedgerContent({ id }: { id: string }) {
    const party = await getPartyById(id)
    if (!party) notFound()

    // Party is exclusively CUSTOMER or SUPPLIER (see lib/schemas/party-schema.ts) — never both.
    if (party.partyType === "SUPPLIER") {
        const { transactions, summary } = await getSupplierTransactions(id)
        return (
            <SupplierKhataDetail
                party={{ name: party.name, phone: party.phone }}
                transactions={transactions}
                netBalance={summary.netBalance}
            />
        )
    }

    const [gstLedger, gstSummary, nogstLedger, nogstSummary] = await Promise.all([
        getPartyLedger(id, "sales", { isGst: true, applyOpeningBalance: false }),
        getPartyLedgerSummary(id, "sales", { isGst: true, applyOpeningBalance: false }),
        getPartyLedger(id, "sales", { isGst: false, applyOpeningBalance: true }),
        getPartyLedgerSummary(id, "sales", { isGst: false, applyOpeningBalance: true }),
    ])

    return (
        <>
            {/* Party Header */}
            <PartyHeader party={party} />

            {/* Sales side — With GST / Without GST tabs */}
            <PartyGstLedgerTabs
                party={party}
                partyType={party.partyType}
                gstLedger={gstLedger}
                gstSummary={gstSummary}
                nogstLedger={nogstLedger}
                nogstSummary={nogstSummary}
            />
        </>
    )
}

function HeaderSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-4 w-28 bg-card" />
            <Skeleton className="h-36 w-full bg-card rounded-xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 bg-card rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-28 w-full bg-card rounded-xl" />
            <Skeleton className="h-[420px] w-full bg-card rounded-xl" />
        </div>
    )
}
