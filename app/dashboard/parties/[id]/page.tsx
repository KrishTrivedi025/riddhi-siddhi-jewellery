import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getPartyById, getPartyLedger, getPartyLedgerSummary } from "@/lib/actions/party-ledger"
import { PartyHeader } from "@/components/parties/party-header"
import { PartyBalanceCards } from "@/components/parties/party-balance-cards"
import { PartyGstLedgerTabs } from "@/components/parties/party-gst-ledger-tabs"
import { PartyLedgerTable } from "@/components/parties/party-ledger-table"
import { PartyStatementExport } from "@/components/parties/party-statement-export"
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

    // Party is exclusively CUSTOMER or SUPPLIER (see lib/schemas/party-schema.ts) — never both,
    // so opening balance always belongs cleanly to whichever single ledger applies here.
    const isCustomerFacing = party.partyType === "CUSTOMER"
    const isVendorFacing = party.partyType === "SUPPLIER"

    const [gstLedger, gstSummary, nogstLedger, nogstSummary, purchaseLedger, purchaseSummary] = await Promise.all([
        isCustomerFacing ? getPartyLedger(id, "sales", { isGst: true, applyOpeningBalance: false }) : Promise.resolve([]),
        isCustomerFacing ? getPartyLedgerSummary(id, "sales", { isGst: true, applyOpeningBalance: false }) : Promise.resolve(null),
        isCustomerFacing ? getPartyLedger(id, "sales", { isGst: false, applyOpeningBalance: true }) : Promise.resolve([]),
        isCustomerFacing ? getPartyLedgerSummary(id, "sales", { isGst: false, applyOpeningBalance: true }) : Promise.resolve(null),
        isVendorFacing ? getPartyLedger(id, "purchase", { applyOpeningBalance: true }) : Promise.resolve([]),
        isVendorFacing ? getPartyLedgerSummary(id, "purchase", { applyOpeningBalance: true }) : Promise.resolve(null),
    ])

    return (
        <>
            {/* Party Header */}
            <PartyHeader party={party} />

            {/* Sales side — With GST / Without GST tabs */}
            {isCustomerFacing && gstSummary && nogstSummary && (
                <PartyGstLedgerTabs
                    party={party}
                    partyType={party.partyType}
                    gstLedger={gstLedger}
                    gstSummary={gstSummary}
                    nogstLedger={nogstLedger}
                    nogstSummary={nogstSummary}
                />
            )}

            {/* Purchase side (supplier parties) */}
            {isVendorFacing && purchaseSummary && (
                <div className="space-y-4">
                    <PartyBalanceCards summary={purchaseSummary} partyType={party.partyType} />
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    Transaction Ledger
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Full statement of account with running balance
                                </p>
                            </div>
                            <PartyStatementExport
                                party={party}
                                entries={purchaseLedger}
                                summary={purchaseSummary}
                            />
                        </div>
                        <PartyLedgerTable
                            entries={purchaseLedger}
                            partyName={party.name}
                        />
                    </div>
                </div>
            )}
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
