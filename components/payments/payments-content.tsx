"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaymentTable } from "./payment-table"
import { AnimatedTabs } from "@/components/shared/animated-tabs"

interface PaymentsContentProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentsIn: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentsOut: any[]
}

const tabs = [
    { id: "in", label: "Payment In", icon: <ArrowDownLeft size={14} /> },
    { id: "out", label: "Payment Out", icon: <ArrowUpRight size={14} /> },
]

export function PaymentsContent({ paymentsIn, paymentsOut }: PaymentsContentProps) {
    const [activeTab, setActiveTab] = useState("in")
    const router = useRouter()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Cash & Bank</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track customer receipts, supplier payments, and bank transactions
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => router.push("/dashboard/payments/in/new")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                        <ArrowDownLeft size={16} className="mr-2" />
                        Receive Payment
                    </Button>
                    <Button
                        onClick={() => router.push("/dashboard/payments/out/new")}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    >
                        <ArrowUpRight size={16} className="mr-2" />
                        Make Payment
                    </Button>
                </div>
            </div>

            {/* Quick Stats Banner placeholder */}
            
            {/* Tabs */}
            <AnimatedTabs 
                tabs={tabs.map(t => ({...t, count: t.id === "in" ? paymentsIn.length : paymentsOut.length}))} 
                activeTab={activeTab} 
                onChange={setActiveTab} 
                layoutIdPrefix="payments"
            />

            {/* Content */}
            {activeTab === "in" && (
                <PaymentTable payments={paymentsIn} type="IN" />
            )}
            {activeTab === "out" && (
                <PaymentTable payments={paymentsOut} type="OUT" />
            )}
        </div>
    )
}
