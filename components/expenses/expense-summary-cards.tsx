"use client"

import { TrendingDown, Sparkles, ListChecks, Calculator } from "lucide-react"
import { formatCurrency } from "@/lib/gst-utils"
import { useEffect, useRef } from "react"

interface ExpenseSummaryCardsProps {
    totalAmount:    number
    totalGstCredit: number
    count:          number
    monthCount?:    number   // for avg per month
}

export function ExpenseSummaryCards({
    totalAmount,
    totalGstCredit,
    count,
    monthCount = 1,
}: ExpenseSummaryCardsProps) {
    const avgPerMonth = monthCount > 0 ? totalAmount / monthCount : totalAmount

    const cards = [
        {
            label:   "Total Expenses",
            value:   formatCurrency(totalAmount),
            sub:     `${count} transaction${count !== 1 ? "s" : ""}`,
            icon:    TrendingDown,
            iconBg:  "bg-rose-500/10 text-rose-400",
            glow:    "group-hover:shadow-rose-500/5",
            accent:  "text-rose-400",
            border:  "group-hover:border-rose-500/20",
        },
        {
            label:   "GST Input Credit",
            value:   formatCurrency(totalGstCredit),
            sub:     "Reclaimable from GSTR-3B",
            icon:    Sparkles,
            iconBg:  "bg-emerald-500/10 text-emerald-400",
            glow:    "group-hover:shadow-emerald-500/5",
            accent:  "text-emerald-400",
            border:  "group-hover:border-emerald-500/20",
        },
        {
            label:   "Total Records",
            value:   count.toString(),
            sub:     "Expense entries logged",
            icon:    ListChecks,
            iconBg:  "bg-blue-500/10 text-blue-400",
            glow:    "group-hover:shadow-blue-500/5",
            accent:  "text-blue-400",
            border:  "group-hover:border-blue-500/20",
        },
        {
            label:   "Avg / Month",
            value:   formatCurrency(avgPerMonth),
            sub:     "Based on filtered period",
            icon:    Calculator,
            iconBg:  "bg-primary/10 text-primary",
            glow:    "group-hover:shadow-primary/5",
            accent:  "text-primary",
            border:  "group-hover:border-primary/20",
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map(({ label, value, sub, icon: Icon, iconBg, glow, accent, border }) => (
                <div
                    key={label}
                    className={`relative bg-card border border-border ${border} rounded-2xl p-5 overflow-hidden
                        group cursor-default transition-all duration-300
                        hover:-translate-y-0.5 hover:shadow-xl ${glow}`}
                >
                    {/* Background icon watermark */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-8 group-hover:scale-110 transition-all duration-500">
                        <Icon size={72} />
                    </div>

                    <div className="relative z-10">
                        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${iconBg} mb-3`}>
                            <Icon size={16} />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {label}
                        </p>
                        <p className={`text-2xl font-black ${accent} tabular-nums leading-tight`}>
                            {value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
