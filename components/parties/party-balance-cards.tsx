"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { PartyLedgerSummary } from "@/lib/actions/party-ledger"
import { format } from "date-fns"

interface PartyBalanceCardsProps {
    summary: PartyLedgerSummary
    partyType: string
}

function useCountUp(target: number, duration = 1000) {
    const [current, setCurrent] = useState(0)
    const rafRef = useRef<number | null>(null)
    const startTimeRef = useRef<number | null>(null)

    useEffect(() => {
        if (target === 0) {
            setCurrent(0)
            return
        }
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp
            const elapsed = timestamp - startTimeRef.current
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            setCurrent(Math.floor(eased * target))
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate)
            } else {
                setCurrent(target)
            }
        }
        rafRef.current = requestAnimationFrame(animate)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [target, duration])

    return current
}

function formatINR(value: number) {
    if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(2)}L`
    if (value >= 1_000) return `₹${value.toLocaleString("en-IN")}`
    return `₹${value}`
}

interface StatCardProps {
    title: string
    value: number
    subtitle: string
    icon: React.ReactNode
    accentColor: string
    bgColor: string
    borderColor: string
    animate?: boolean
}

function StatCard({
    title,
    value,
    subtitle,
    icon,
    accentColor,
    bgColor,
    borderColor,
    animate = true,
}: StatCardProps) {
    const displayValue = useCountUp(animate ? value : 0, 900)
    const finalValue = animate ? displayValue : value

    return (
        <Card className={`${bgColor} border ${borderColor} overflow-hidden`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                            {title}
                        </p>
                        <p className={`text-2xl font-bold ${accentColor}`}>
                            {formatINR(finalValue)}
                        </p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                    <div
                        className={`p-2.5 rounded-lg ${accentColor.replace("text-", "bg-").replace("-400", "-500/10").replace("-500", "-500/10")}`}
                    >
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function PartyBalanceCards({
    summary,
    partyType,
}: PartyBalanceCardsProps) {
    const isDebit = summary.balanceType === "debit"
    const isCustomer = partyType === "CUSTOMER" || partyType === "BOTH"

    const outstandingLabel = isDebit
        ? isCustomer
            ? "Receivable (Party Owes You)"
            : "You Owe Party"
        : isCustomer
          ? "You Owe Party"
          : "Payable (You Owe Party)"

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Outstanding balance — refined card */}
            <Card
                className={`col-span-2 lg:col-span-1 border-2 overflow-hidden shadow-sm transition-all duration-300 ${
                    isDebit
                        ? "bg-emerald-50/50 border-emerald-100/50 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                        : "bg-rose-50/50 border-rose-100/50 dark:bg-rose-500/10 dark:border-rose-500/20"
                }`}
            >
                <div
                    className={`h-1.5 w-full ${isDebit ? "bg-emerald-500/30" : "bg-rose-500/30"}`}
                />
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">
                                Outstanding
                            </p>
                            <div className="flex items-baseline gap-1">
                                <p className={`text-2xl font-black tracking-tight ${isDebit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                    ₹{summary.outstandingBalance.toLocaleString("en-IN")}
                                </p>
                                <span className={`text-xs font-bold ${isDebit ? "text-emerald-500/70 dark:text-emerald-400/70" : "text-rose-500/70 dark:text-rose-400/70"}`}>
                                    {isDebit ? "Dr" : "Cr"}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground/80 font-medium">
                                {outstandingLabel}
                            </p>
                        </div>
                        <div
                            className={`p-2 rounded-xl border transition-colors ${
                                isDebit 
                                    ? "bg-white border-emerald-100 text-emerald-500 shadow-sm shadow-emerald-100/50 dark:bg-card dark:border-emerald-500/30 dark:text-emerald-400 dark:shadow-none" 
                                    : "bg-white border-rose-100 text-rose-500 shadow-sm shadow-rose-100/50 dark:bg-card dark:border-rose-500/30 dark:text-rose-400 dark:shadow-none"
                            }`}
                        >
                            {isDebit ? (
                                <ArrowUpRight size={18} strokeWidth={2.5} />
                            ) : (
                                <ArrowDownRight size={18} strokeWidth={2.5} />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Total Sales */}
            <StatCard
                title="Total Sales"
                value={summary.totalSales}
                subtitle="All time invoices"
                accentColor="text-blue-400"
                bgColor="bg-card"
                borderColor="border-border"
                icon={<TrendingUp size={18} className="text-blue-400" />}
            />

            {/* Total Purchases */}
            <StatCard
                title="Total Purchases"
                value={summary.totalPurchases}
                subtitle="All time purchases"
                accentColor="text-amber-400"
                bgColor="bg-card"
                borderColor="border-border"
                icon={<TrendingDown size={18} className="text-amber-400" />}
            />

            {/* Last Transaction */}
            <Card className="bg-card border-border">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                Last Activity
                            </p>
                            <p className="text-lg font-bold text-foreground">
                                {summary.lastTransactionDate
                                    ? format(
                                          new Date(
                                              summary.lastTransactionDate
                                          ),
                                          "dd MMM yyyy"
                                      )
                                    : "No activity"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Payments: ₹
                                {summary.totalPaymentsIn.toLocaleString(
                                    "en-IN"
                                )}{" "}
                                in
                            </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-primary/10">
                            <Clock size={18} className="text-primary" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
