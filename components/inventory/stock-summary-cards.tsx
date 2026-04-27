"use client"

import { Package, IndianRupee, AlertTriangle, XCircle, TrendingUp, Database } from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"

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
    const isAlert = summary.lowStockCount > 0 || summary.outOfStockCount > 0
    
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
                label="Total Items"
                value={summary.totalItems}
                iconName="database"
                color="border-[#D4A017]/30 bg-[#D4A017]/10 text-[#D4A017]"
                prefix=""
            />
            <KPICard
                label="Cost Value"
                value={summary.totalStockValueCost}
                iconName="shopping-bag"
                color="border-blue-500/30 bg-blue-500/10 text-blue-500"
                prefix="₹"
            />
            <KPICard
                label="Sale Value"
                value={summary.totalStockValueSale}
                iconName="trending-up"
                color="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                prefix="₹"
            />
            <KPICard
                label="Low Stock"
                value={summary.lowStockCount + summary.outOfStockCount}
                iconName="arrow-down-left"
                color={isAlert ? "border-amber-500/30 bg-amber-500/10 text-amber-500" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"}
                prefix=""
            />
        </div>
    )
}
