import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getPartyById, getPartyLedger, getPartyLedgerSummary } from "@/lib/actions/party-ledger"
import { getSupplierTransactions } from "@/lib/actions/supplier-transactions"
import { getWorkerLedger } from "@/lib/actions/workers"
import { PartyHeader } from "@/components/parties/party-header"
import { PartyGstLedgerTabs } from "@/components/parties/party-gst-ledger-tabs"
import { SupplierKhataDetail } from "@/components/parties/supplier-khata-detail"
import { WorkerKhataDetail } from "@/components/parties/worker-khata-detail"
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
    // A SUPPLIER additionally branches on isWorker: a worker's ledger is scoped to the
    // current calendar month and adds an attendance calendar, rather than the plain
    // lifetime khata a regular supplier gets.
    if (party.partyType === "SUPPLIER") {
        if (party.isWorker) {
            const { transactions, summary } = await getWorkerLedger(id)
            return (
                <WorkerKhataDetail
                    party={{ id: party.id, name: party.name, phone: party.phone }}
                    transactions={transactions}
                    summary={summary}
                />
            )
        }

        const { transactions, summary } = await getSupplierTransactions(id)
        return (
            <SupplierKhataDetail
                party={{ id: party.id, name: party.name, phone: party.phone }}
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

// Shape-neutral — this fallback shows before we know whether the party is a
// customer (ledger tabs) or supplier (khata list), so it approximates both
// with a header card + repeated rows rather than committing to either shape.
function HeaderSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-4 w-28 bg-card" />
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <Skeleton className="h-1 w-full rounded-none" />
                <div className="p-5 flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <div className="border-t border-border px-5 py-3.5">
                    <Skeleton className="h-5 w-32" />
                </div>
            </div>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-card rounded-xl" />
                ))}
            </div>
        </div>
    )
}
