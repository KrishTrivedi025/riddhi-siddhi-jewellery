"use client"

import { useState } from "react"
import { Receipt, FileText } from "lucide-react"
import { AnimatedTabs } from "@/components/shared/animated-tabs"
import { PartyBalanceCards } from "./party-balance-cards"
import { PartyAging } from "./party-aging"
import { PartyLedgerTable } from "./party-ledger-table"
import { PartyStatementExport } from "./party-statement-export"
import type { LedgerEntry, PartyLedgerSummary } from "@/lib/actions/party-ledger"

interface PartyGstLedgerTabsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    party: any
    partyType: string
    gstLedger: LedgerEntry[]
    gstSummary: PartyLedgerSummary
    nogstLedger: LedgerEntry[]
    nogstSummary: PartyLedgerSummary
}

export function PartyGstLedgerTabs({
    party,
    partyType,
    gstLedger,
    gstSummary,
    nogstLedger,
    nogstSummary,
}: PartyGstLedgerTabsProps) {
    const [activeTab, setActiveTab] = useState<"gst" | "nogst">("gst")

    const ledger = activeTab === "gst" ? gstLedger : nogstLedger
    const summary = activeTab === "gst" ? gstSummary : nogstSummary

    return (
        <div className="space-y-4">
            <AnimatedTabs
                layoutIdPrefix="party-gst"
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as "gst" | "nogst")}
                tabs={[
                    { id: "gst", label: "With GST", icon: <FileText size={14} /> },
                    { id: "nogst", label: "Without GST", icon: <Receipt size={14} /> },
                ]}
            />

            <PartyBalanceCards summary={summary} partyType={partyType} />

            {(partyType === "CUSTOMER" || partyType === "BOTH") && (
                <PartyAging
                    aging={summary.aging}
                    totalOutstanding={summary.outstandingBalance}
                />
            )}

            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">
                            {activeTab === "gst" ? "With GST — Transaction Ledger" : "Without GST — Transaction Ledger"}
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

                <PartyLedgerTable
                    entries={ledger}
                    partyName={party.name}
                />
            </div>
        </div>
    )
}
