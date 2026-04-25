"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileText, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PurchaseTable } from "./purchase-table"
import { PurchaseReturnTable } from "./return-table"
import { AnimatedTabs } from "@/components/shared/animated-tabs"

interface PurchasesContentProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoices: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    returns: any[]
}

const tabs = [
    { id: "invoices", label: "Purchase Invoices", icon: <FileText size={14} /> },
    { id: "returns", label: "Debit Notes", icon: <RotateCcw size={14} /> },
]

export function PurchasesContent({ invoices, returns }: PurchasesContentProps) {
    const [activeTab, setActiveTab] = useState("invoices")
    const router = useRouter()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Purchases</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage supplier bills, purchase invoices, and debit notes
                    </p>
                </div>
                <div className="flex gap-3">
                    {activeTab === "invoices" ? (
                        <Button
                            onClick={() => router.push("/dashboard/purchases/new")}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        >
                            <Plus size={16} className="mr-2" />
                            Record Purchase
                        </Button>
                    ) : (
                        <Button
                            onClick={() => router.push("/dashboard/purchases/returns/new")}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        >
                            <Plus size={16} className="mr-2" />
                            New Debit Note
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <AnimatedTabs 
                tabs={tabs.map(t => ({...t, count: t.id === "invoices" ? invoices.length : returns.length}))} 
                activeTab={activeTab} 
                onChange={setActiveTab} 
                layoutIdPrefix="purchases"
            />

            {/* Content */}
            {activeTab === "invoices" ? (
                <PurchaseTable invoices={invoices} />
            ) : (
                <PurchaseReturnTable returns={returns} />
            )}
        </div>
    )
}
