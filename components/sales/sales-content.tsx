"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileText, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InvoiceTable } from "./invoice-table"
import { ReturnTable } from "./return-table"
import { AnimatedTabs } from "@/components/shared/animated-tabs"
import { useT } from "@/lib/i18n/client"

interface SalesContentProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoices: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    returns: any[]
}

export function SalesContent({ invoices, returns }: SalesContentProps) {
    const { t } = useT("sales")
    const [activeTab, setActiveTab] = useState("invoices")
    const router = useRouter()

    const tabs = [
        { id: "invoices", label: t("title"), icon: <FileText size={14} /> },
        { id: "returns", label: t("creditNote"), icon: <RotateCcw size={14} /> },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("subtitle")}
                    </p>
                </div>
                <div className="flex gap-3">
                    {activeTab === "invoices" ? (
                        <Button
                            onClick={() => router.push("/dashboard/sales/new")}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        >
                            <Plus size={16} className="mr-2" />
                            {t("newInvoice")}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => router.push("/dashboard/sales/returns/new")}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        >
                            <Plus size={16} className="mr-2" />
                            {t("creditNote")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <AnimatedTabs 
                tabs={tabs.map(t => ({...t, count: t.id === "invoices" ? invoices.length : returns.length}))} 
                activeTab={activeTab} 
                onChange={setActiveTab} 
                layoutIdPrefix="sales"
            />

            {/* Content */}
            {activeTab === "invoices" ? (
                <InvoiceTable invoices={invoices} />
            ) : (
                <ReturnTable returns={returns} />
            )}
        </div>
    )
}
