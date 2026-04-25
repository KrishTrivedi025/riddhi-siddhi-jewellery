import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getPartyById, getPartyLedger, getPartyLedgerSummary } from "@/lib/actions/party-ledger"
import { PartyHeader } from "@/components/parties/party-header"
import { PartyBalanceCards } from "@/components/parties/party-balance-cards"
import { PartyAging } from "@/components/parties/party-aging"
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

    const [ledger, summary] = await Promise.all([
        getPartyLedger(id),
        getPartyLedgerSummary(id),
    ])

    return (
        <>
            {/* Party Header */}
            <PartyHeader party={party} />

            {/* Balance Summary Cards */}
            <PartyBalanceCards summary={summary} partyType={party.partyType} />

            {/* Aging Analysis — only shown for customers or BOTH */}
            {(party.partyType === "CUSTOMER" || party.partyType === "BOTH") && (
                <PartyAging
                    aging={summary.aging}
                    totalOutstanding={summary.outstandingBalance}
                />
            )}

            {/* Ledger Table + Export Controls */}
            <div className="space-y-3">
                {/* Action bar */}
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
                        entries={ledger}
                        summary={summary}
                    />
                </div>

                {/* Ledger table */}
                <PartyLedgerTable
                    entries={ledger}
                    partyName={party.name}
                />
            </div>
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
