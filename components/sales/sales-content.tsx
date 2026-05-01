"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileText, RotateCcw, X, Receipt, FileX } from "lucide-react"
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
    const [activeTab, setActiveTab] = useState("gst")
    const [showModal, setShowModal] = useState(false)
    const router = useRouter()

    const gstInvoices = invoices.filter((inv) => inv.isGst !== false)
    const noGstInvoices = invoices.filter((inv) => inv.isGst === false)

    const tabs = [
        { id: "gst", label: "With GST", icon: <Receipt size={14} /> },
        { id: "nogst", label: "Without GST", icon: <FileX size={14} /> },
        { id: "returns", label: t("creditNote"), icon: <RotateCcw size={14} /> },
    ]

    const handleNewInvoice = () => {
        if (activeTab === "gst") {
            setShowModal(true)
        } else if (activeTab === "nogst") {
            router.push("/dashboard/sales/new?type=nogst")
        } else {
            router.push("/dashboard/sales/returns/new")
        }
    }

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
                <Button
                    onClick={handleNewInvoice}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                    <Plus size={16} className="mr-2" />
                    {activeTab === "returns" ? t("creditNote") : t("newInvoice")}
                </Button>
            </div>

            {/* Tabs */}
            <AnimatedTabs
                tabs={[
                    { id: "gst", label: "With GST", icon: <Receipt size={14} />, count: gstInvoices.length },
                    { id: "nogst", label: "Without GST", icon: <FileX size={14} />, count: noGstInvoices.length },
                    { id: "returns", label: t("creditNote"), icon: <RotateCcw size={14} />, count: returns.length },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                layoutIdPrefix="sales"
            />

            {/* Content */}
            {activeTab === "gst" && <InvoiceTable invoices={gstInvoices} />}
            {activeTab === "nogst" && <InvoiceTable invoices={noGstInvoices} />}
            {activeTab === "returns" && <ReturnTable returns={returns} />}

            {/* Bill Type Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                    onClick={() => setShowModal(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal */}
                    <div
                        className="relative z-10 w-full sm:max-w-sm mx-4 sm:mx-auto bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                        >
                            <X size={16} />
                        </button>

                        {/* Title */}
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-foreground">New Sale Invoice</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">Choose bill type</p>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {/* With GST */}
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    router.push("/dashboard/sales/new?type=gst")
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition-all active:scale-[0.98] text-left group"
                            >
                                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                                    <Receipt size={20} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">With GST</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">GST applied on all items</p>
                                </div>
                            </button>

                            {/* Without GST */}
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    router.push("/dashboard/sales/new?type=nogst")
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60 transition-all active:scale-[0.98] text-left group"
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/25 transition-colors">
                                    <FileX size={20} className="text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">Without GST</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">No GST — separate prefix &amp; series</p>
                                </div>
                            </button>
                        </div>

                        {/* Bottom drag handle for mobile */}
                        <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-6 sm:hidden" />
                    </div>
                </div>
            )}
        </div>
    )
}
