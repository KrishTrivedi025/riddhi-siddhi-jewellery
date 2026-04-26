"use client"

import { useEffect } from "react"
import { motion, useMotionValue, useTransform, useSpring, animate } from "framer-motion"
import {
    ShoppingCart,
    ShoppingBag,
    ArrowDownLeft,
    ArrowUpRight,
    TrendingUp,
    Database,
    Wallet,
    Landmark,
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { tapScale, countUpSpring } from "@/lib/animations"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

const ICON_MAP: Record<string, LucideIcon> = {
    "shopping-cart":  ShoppingCart,
    "shopping-bag":   ShoppingBag,
    "arrow-down-left":ArrowDownLeft,
    "arrow-up-right": ArrowUpRight,
    "trending-up":    TrendingUp,
    "database":       Database,
    "wallet":         Wallet,
    "landmark":       Landmark,
}

interface KPICardProps {
    label: string
    value: number
    iconName: string
    color: string
    prefix?: string
}

export function KPICard({ label, value, iconName, color, prefix = "₹" }: KPICardProps) {
    const reduce = useReducedMotion()
    const Icon = ICON_MAP[iconName] || TrendingUp

    // Smooth spring count-up
    const mv = useMotionValue(0)
    const spring = useSpring(mv, countUpSpring)
    const display = useTransform(spring, (v) =>
        prefix + Math.floor(v).toLocaleString("en-IN")
    )

    useEffect(() => {
        if (reduce) {
            mv.set(value)
        } else {
            const controls = animate(mv, value, { duration: 1.2, ease: "easeOut" })
            return controls.stop
        }
    }, [mv, value, reduce])

    return (
        <motion.div
            whileTap={reduce ? {} : tapScale}
            className="bg-card border border-border rounded-2xl relative overflow-hidden group cursor-default select-none"
            style={{ willChange: "transform" }}
        >
            {/* Compact card — same feel as quick action cards */}
            <div className="flex items-center gap-3 p-3">
                {/* Small icon badge */}
                <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    "border transition-all duration-300",
                    color
                )}>
                    <Icon size={16} className="text-foreground/80" />
                </div>

                {/* Values — stacked right of icon */}
                <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide leading-none mb-1 truncate">
                        {label}
                    </p>
                    <motion.p className="text-foreground font-bold text-sm tabular-nums truncate">
                        {display}
                    </motion.p>
                </div>
            </div>

            {/* Subtle ambient glow */}
            <div className={cn(
                "absolute -right-3 -bottom-3 w-14 h-14 rounded-full blur-2xl",
                "opacity-15 group-hover:opacity-30 transition-opacity duration-500",
                color,
            )} />
        </motion.div>
    )
}
