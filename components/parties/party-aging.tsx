"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import type { AgingBucket } from "@/lib/actions/party-ledger"

interface PartyAgingProps {
    aging: AgingBucket[]
    totalOutstanding: number
}

const agingConfig = [
    {
        color: "text-emerald-600",
        bg: "bg-emerald-500/5",
        border: "border-emerald-500/10",
        bar: "bg-emerald-500/40",
        icon: "🟢",
    },
    {
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        bar: "bg-amber-500",
        icon: "🟡",
    },
    {
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        bar: "bg-orange-500",
        icon: "🟠",
    },
    {
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        bar: "bg-rose-500",
        icon: "🔴",
    },
]

export function PartyAging({ aging, totalOutstanding }: PartyAgingProps) {
    const hasOutstanding = aging.some((b) => b.amount > 0)

    if (!hasOutstanding) {
        return (
            <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle size={16} className="text-primary" />
                        Outstanding Aging Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-16 text-sm text-muted-foreground italic">
                        No outstanding invoices — all clear ✅
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle size={16} className="text-primary" />
                    Outstanding Aging Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {aging.map((bucket, idx) => {
                        const config = agingConfig[idx]
                        const percentage =
                            totalOutstanding > 0
                                ? (bucket.amount / totalOutstanding) * 100
                                : 0

                        return (
                            <div
                                key={bucket.label}
                                className={`rounded-xl p-4 border ${config.border} ${config.bg} space-y-3`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {bucket.label}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {bucket.days}
                                    </span>
                                </div>
                                <p
                                    className={`text-lg font-bold ${config.color}`}
                                >
                                    ₹{bucket.amount.toLocaleString("en-IN")}
                                </p>
                                <div className="space-y-1">
                                    {/* Progress bar */}
                                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${config.bar} transition-all duration-700`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {bucket.invoiceCount} invoice
                                        {bucket.invoiceCount !== 1 ? "s" : ""} ·{" "}
                                        {percentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
