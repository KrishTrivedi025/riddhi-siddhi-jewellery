"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PartyTable } from "./party-table"
import { PartyDialog } from "./party-dialog"
import { PartyFab } from "./party-fab"
import { QuickSupplierDialog } from "./quick-supplier-dialog"
import { SupplierKhataList } from "./supplier-khata-list"
import { Users, ShoppingCart, UserPlus } from "lucide-react"
import { AnimatedTabs } from "@/components/shared/animated-tabs"
import { useT } from "@/lib/i18n/client"
import type { SupplierKhataSummary } from "@/lib/actions/supplier-transactions"

interface PartiesContentProps {
    customers: any[]
    suppliers: any[]
    supplierKhata: SupplierKhataSummary
}

type TabKey = "customers" | "suppliers"

export function PartiesContent({ customers, suppliers, supplierKhata }: PartiesContentProps) {
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

    return (
        <>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
                <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
            </div>

            {/* Animated Tabs */}
            <AnimatedTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as TabKey)}
                layoutIdPrefix="parties"
            />

            {activeTab === "customers" ? (
                <>
                    <PartyTable data={customers} />
                    <PartyDialog
                        trigger={<PartyFab label="ADD CUSTOMER" icon={<UserPlus size={18} />} />}
                    />
                </>
            ) : (
                <>
                    <SupplierKhataList
                        summary={supplierKhata}
                        onReportClick={() => toast.info("Supplier reports are coming soon")}
                    />
                    <QuickSupplierDialog
                        trigger={<PartyFab label="ADD SUPPLIER" icon={<UserPlus size={18} />} />}
                    />
                </>
            )}
        </>
    )
}
