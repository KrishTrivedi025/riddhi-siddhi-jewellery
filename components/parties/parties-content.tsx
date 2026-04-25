"use client"

import { useState } from "react"
import { PartyTable } from "./party-table"
import { PartyDialog } from "./party-dialog"
import { Users, ShoppingCart } from "lucide-react"
import { AnimatedTabs } from "@/components/shared/animated-tabs"
import { useT } from "@/lib/i18n/client"

interface PartiesContentProps {
    customers: any[]
    suppliers: any[]
}

type TabKey = "customers" | "suppliers"

export function PartiesContent({ customers, suppliers }: PartiesContentProps) {
    const { t } = useT("parties")
    const [activeTab, setActiveTab] = useState<TabKey>("customers")

    const tabs = [
        {
            id: "customers",
            label: t("customers"),
            count: customers.length,
            icon: <Users size={14} />,
            activeColorClass: "bg-primary/10 border-primary/40 text-primary",
        },
        {
            id: "suppliers",
            label: t("suppliers"),
            count: suppliers.length,
            icon: <ShoppingCart size={14} />,
            activeColorClass: "bg-blue-500/10 border-blue-500/40 text-blue-500",
        },
    ]

    const displayData = activeTab === "customers" ? customers : suppliers

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
                </div>
                <PartyDialog />
            </div>

            {/* Animated Tabs */}
            <AnimatedTabs 
                tabs={tabs} 
                activeTab={activeTab} 
                onChange={(id) => setActiveTab(id as TabKey)} 
                layoutIdPrefix="parties"
            />

            {/* Table */}
            <PartyTable data={displayData} />
        </>
    )
}
