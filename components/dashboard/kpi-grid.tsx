"use client"

import { motion } from "framer-motion"
import {
    ShoppingCart,
    ShoppingBag,
    ArrowDownLeft,
    ArrowUpRight,
    TrendingUp,
    Database,
    Wallet,
    Landmark,
} from "lucide-react"
import { KPICard } from "./kpi-card"
import { containerVariants, itemVariants } from "@/lib/animations"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

interface KPIGridProps {
    stats: any
}

const cards = (stats: any) => [
    { label: "Total Sales",             value: stats.totalSales,      iconName: "shopping-cart",   color: "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/20 dark:border-blue-500/30"    },
    { label: "Total Purchases",         value: stats.totalPurchases,  iconName: "shopping-bag",    color: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/20 dark:border-amber-500/30" },
    { label: "Net Profit",              value: stats.netProfit,       iconName: "trending-up",
      color: stats.netProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/20 dark:border-emerald-500/30" : "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/20 dark:border-rose-500/30" },
    { label: "Inventory Value",         value: stats.inventoryValue,  iconName: "database",        color: "bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/20 dark:border-purple-500/30" },
    { label: "Outstanding Receivable",  value: stats.totalReceivable, iconName: "arrow-down-left", color: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400" },
    { label: "Outstanding Payable",     value: stats.totalPayable,    iconName: "arrow-up-right",  color: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400"     },
    { label: "Cash in Hand",            value: stats.cashBalance,     iconName: "wallet",          color: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/20 dark:border-amber-500/30"   },
    { label: "Bank Balance",            value: stats.bankBalance,     iconName: "landmark",        color: "bg-sky-500/10 border-sky-500/20 dark:bg-sky-500/20 dark:border-sky-500/30"       },
]

export function KPIGrid({ stats }: KPIGridProps) {
    const reduce = useReducedMotion()
    const data = cards(stats)

    return (
        <motion.div
            variants={reduce ? {} : containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 gap-3"
        >
            {data.map((card, index) => (
                <motion.div key={index} variants={reduce ? {} : itemVariants}>
                    <KPICard
                        label={card.label}
                        value={card.value}
                        iconName={card.iconName}
                        color={card.color}
                    />
                </motion.div>
            ))}
        </motion.div>
    )
}
