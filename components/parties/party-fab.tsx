"use client"

import { forwardRef } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { spring, tapScale } from "@/lib/animations"
import { cn } from "@/lib/utils"

interface PartyFabProps extends Omit<HTMLMotionProps<"button">, "children"> {
    label: string
    icon: React.ReactNode
    /** Stacks a second FAB above this one (e.g. a Report FAB above Add Supplier) */
    offset?: "default" | "raised"
}

export const PartyFab = forwardRef<HTMLButtonElement, PartyFabProps>(
    ({ label, icon, offset = "default", className, ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                type="button"
                initial={{ opacity: 0, scale: 0.8, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={spring}
                whileTap={tapScale}
                className={cn(
                    "fixed z-40 right-4 md:right-6",
                    offset === "raised"
                        ? "bottom-[calc(140px+env(safe-area-inset-bottom,0px))] md:bottom-24"
                        : "bottom-[calc(74px+env(safe-area-inset-bottom,0px))] md:bottom-6",
                    "flex items-center gap-2 rounded-full pl-4 pr-5 py-3",
                    "bg-primary text-primary-foreground font-semibold text-sm tracking-wide",
                    "shadow-[0_6px_24px_rgba(212,160,23,0.35)]",
                    className
                )}
                {...props}
            >
                {icon}
                {label}
            </motion.button>
        )
    }
)
PartyFab.displayName = "PartyFab"
