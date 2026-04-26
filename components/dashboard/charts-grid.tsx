"use client"

import { motion } from "framer-motion"
import { SalesPurchaseChart } from "./sales-purchase-chart"
import { ProfitLossChart } from "./profit-loss-chart"
import { PaymentDonutChart } from "./payment-donut-chart"
import { containerVariants, itemVariants } from "@/lib/animations"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

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
