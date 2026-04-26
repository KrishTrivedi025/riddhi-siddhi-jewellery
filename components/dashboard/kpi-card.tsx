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
import { hoverLift, tapScale, countUpSpring } from "@/lib/animations"
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
            const controls = animate(mv, value, { duration: 1.4, ease: "easeOut" })
            return controls.stop
        }
    }, [mv, value, reduce])

    return (
        <motion.div
            whileHover={reduce ? {} : hoverLift}
            whileTap={reduce ? {} : tapScale}
            className="bg-card border border-border rounded-2xl p-4 md:p-6 relative overflow-hidden group
                       cursor-default select-none"
            style={{ willChange: "transform" }}
        >
            {/* Icon badge */}
            <div className="flex items-center justify-between mb-4">
                <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    "border transition-all duration-300 group-hover:scale-110",
                    color
                )}>
                    <Icon size={20} className="text-foreground/80" />
                </div>
            </div>

            {/* Values */}
            <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    {label}
                </p>
                <motion.h3 className="text-lg md:text-2xl font-bold text-foreground tabular-nums truncate">
                    {display}
                </motion.h3>
            </div>

            {/* Ambient glow */}
            <div className={cn(
                "absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl",
                "opacity-10 group-hover:opacity-25 transition-opacity duration-500",
                color,
            )} />
        </motion.div>
    )
}
