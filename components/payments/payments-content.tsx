"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaymentTable } from "./payment-table"
import { AnimatedTabs } from "@/components/shared/animated-tabs"

interface PaymentsContentProps {
    paymentsIn: any[]
    paymentsOut: any[]
}

const tabs = [
    { id: "in",  label: "Payment In",  icon: <ArrowDownLeft size={14} /> },
    { id: "out", label: "Payment Out", icon: <ArrowUpRight size={14} /> },
]

export function PaymentsContent({ paymentsIn, paymentsOut }: PaymentsContentProps) {
    const [activeTab, setActiveTab] = useState("in")
    const router = useRouter()

    return (
        <div className="space-y-6">
            {/* Header — stacks on mobile */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Cash & Bank</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track customer receipts, supplier payments, and bank transactions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => router.push("/dashboard/payments/in/new")}
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                    >
                        <ArrowDownLeft size={15} className="mr-1.5" />
                        Receive
                    </Button>
                    <Button
                        onClick={() => router.push("/dashboard/payments/out/new")}
                        className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm"
                    >
                        <ArrowUpRight size={15} className="mr-1.5" />
                        Pay Out
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <AnimatedTabs
                layoutIdPrefix="payments"
                tabs={tabs.map(t => ({ ...t, count: t.id === "in" ? paymentsIn.length : paymentsOut.length }))}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === "in"
                ? <PaymentTable payments={paymentsIn} type="in" />
                : <PaymentTable payments={paymentsOut} type="out" />
            }
        </div>
    )
}