"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"
import { Skeleton } from "@/components/ui/skeleton"

const chartLoading = () => <Skeleton className="w-full h-[350px] rounded-2xl" />

const SalesPurchaseChart = dynamic(() => import("./sales-purchase-chart").then(m => m.SalesPurchaseChart), { loading: chartLoading })
const ProfitLossChart = dynamic(() => import("./profit-loss-chart").then(m => m.ProfitLossChart), { loading: chartLoading })
const PaymentDonutChart = dynamic(() => import("./payment-donut-chart").then(m => m.PaymentDonutChart), { loading: chartLoading })

interface ChartsGridProps {
    data: any
}

export function ChartsGrid({ data }: ChartsGridProps) {
    const reduce = useReducedMotion()

    return (
        <motion.div
            variants={reduce ? {} : containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-5"
        >
            {[
                <SalesPurchaseChart key="sales" data={data.monthlyData} />,
                <ProfitLossChart    key="pl"    data={data.monthlyData} />,
                <PaymentDonutChart  key="donut" data={data.donutData}   />,
            ].map((chart, i) => (
                <motion.div key={i} variants={reduce ? {} : itemVariants}>
                    {chart}
                </motion.div>
            ))}
        </motion.div>
    )
}
