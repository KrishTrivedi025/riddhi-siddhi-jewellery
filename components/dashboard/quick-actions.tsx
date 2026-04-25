"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { FilePlus, ShoppingBag, PlusCircle } from "lucide-react"
import { containerVariants, tapScale, spring } from "@/lib/animations"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

const actions = [
    { label: "New Invoice",   href: "/dashboard/sales/new",      icon: FilePlus,    color: "text-blue-500",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
    { label: "New Purchase",  href: "/dashboard/purchases/new",  icon: ShoppingBag, color: "text-orange-500",  bg: "bg-orange-500/10",  border: "border-orange-500/20"  },
    { label: "Add Payment",   href: "/dashboard/payments/in/new",icon: PlusCircle,  color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
]

const cardVariant = {
    initial: { opacity: 0, y: 12, scale: 0.97 },
    animate: { opacity: 1, y: 0,  scale: 1 },
}

export function QuickActions() {
    const reduce = useReducedMotion()

    return (
        <motion.div
            variants={reduce ? {} : containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            {actions.map((action, index) => (
                <motion.div
                    key={index}
                    variants={reduce ? {} : cardVariant}
                    transition={{ ...spring, delay: index * 0.06 }}
                    whileHover={reduce ? {} : { y: -3, transition: spring }}
                    whileTap={reduce ? {} : tapScale}
                    style={{ willChange: "transform" }}
                >
                    <Link href={action.href} className="block">
                        <div className={`
                            w-full h-16 rounded-xl border ${action.border} ${action.bg}
                            flex items-center px-6 gap-4 group transition-colors duration-200
                        `}>
                            <div className={`p-2 rounded-lg ${action.bg} group-hover:scale-110 transition-transform duration-200`}>
                                <action.icon size={18} className={action.color} />
                            </div>
                            <span className="text-foreground font-medium text-sm">{action.label}</span>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    )
}
