"use client"

import { Package, IndianRupee, AlertTriangle, XCircle } from "lucide-react"

interface StockSummaryCardsProps {
    summary: {
        totalItems: number
        totalStockValueCost: number
        totalStockValueSale: number
        lowStockCount: number
        outOfStockCount: number
    }
}

export function StockSummaryCards({ summary }: StockSummaryCardsProps) {
    const cards = [
        {
            label: "Total Items",
            value: summary.totalItems.toString(),
            icon: <Package size={16} />,
            color: "#D4A017",
            bg: "rgba(212,160,23,0.08)",
            border: "rgba(212,160,23,0.18)",
        },
        {
            label: "Cost Value",
            value: `₹${summary.totalStockValueCost.toLocaleString("en-IN")}`,
            icon: <IndianRupee size={16} />,
            color: "#3B82F6",
            bg: "rgba(59,130,246,0.08)",
            border: "rgba(59,130,246,0.18)",
        },
        {
            label: "Sale Value",
            value: `₹${summary.totalStockValueSale.toLocaleString("en-IN")}`,
            icon: <IndianRupee size={16} />,
            color: "#22C55E",
            bg: "rgba(34,197,94,0.08)",
            border: "rgba(34,197,94,0.18)",
        },
        {
            label: "Low Stock",
            value: summary.lowStockCount.toString(),
            sub: `${summary.outOfStockCount} out`,
            icon: <AlertTriangle size={16} />,
            color: summary.lowStockCount > 0 || summary.outOfStockCount > 0 ? "#F59E0B" : "#22C55E",
            bg: summary.lowStockCount > 0 || summary.outOfStockCount > 0 ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.08)",
            border: summary.lowStockCount > 0 || summary.outOfStockCount > 0 ? "rgba(245,158,11,0.18)" : "rgba(34,197,94,0.18)",
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                    style={{
                        backgroundColor: card.bg,
                        border: `1px solid ${card.border}`,
                    }}
                >
                    {/* Icon */}
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: card.bg, color: card.color }}
                    >
                        {card.icon}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium truncate">
                            {card.label}
                        </p>
                        <p className="text-sm font-bold leading-tight truncate" style={{ color: card.color }}>
                            {card.value}
                        </p>
                        {card.sub && (
                            <p className="text-[9px] leading-tight" style={{ color: summary.outOfStockCount > 0 ? "#EF4444" : "#A0A0A0" }}>
                                <XCircle size={8} className="inline mr-0.5" />
                                {card.sub}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
