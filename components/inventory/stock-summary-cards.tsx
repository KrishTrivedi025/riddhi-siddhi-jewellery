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
            icon: <Package size={18} />,
            color: "#D4A017",
            bg: "rgba(212,160,23,0.1)",
            border: "rgba(212,160,23,0.2)",
        },
        {
            label: "Stock Value (Cost)",
            value: `₹${summary.totalStockValueCost.toLocaleString("en-IN")}`,
            icon: <IndianRupee size={18} />,
            color: "#3B82F6",
            bg: "rgba(59,130,246,0.1)",
            border: "rgba(59,130,246,0.2)",
        },
        {
            label: "Stock Value (Sale)",
            value: `₹${summary.totalStockValueSale.toLocaleString("en-IN")}`,
            icon: <IndianRupee size={18} />,
            color: "#22C55E",
            bg: "rgba(34,197,94,0.1)",
            border: "rgba(34,197,94,0.2)",
        },
        {
            label: "Low Stock",
            value: summary.lowStockCount.toString(),
            subValue: `${summary.outOfStockCount} out of stock`,
            icon: <AlertTriangle size={18} />,
            color: summary.lowStockCount > 0 || summary.outOfStockCount > 0 ? "#F59E0B" : "#22C55E",
            bg: summary.lowStockCount > 0 || summary.outOfStockCount > 0 ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
            border: summary.lowStockCount > 0 || summary.outOfStockCount > 0 ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)",
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-xl px-5 py-4 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                        backgroundColor: card.bg,
                        border: `1px solid ${card.border}`,
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {card.label}
                        </span>
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: card.bg, color: card.color }}
                        >
                            {card.icon}
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: card.color }}>
                        {card.value}
                    </p>
                    {card.subValue && (
                        <p className="text-[11px] mt-1" style={{ color: summary.outOfStockCount > 0 ? "#EF4444" : "#A0A0A0" }}>
                            <XCircle size={10} className="inline mr-1" />
                            {card.subValue}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}
