"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatCurrency } from "@/lib/gst-utils"
import { PieChartIcon } from "lucide-react"

// 9 distinct premium colours for the categories
const CHART_COLORS = [
    "#D4A017", // gold
    "#EF4444", // rose
    "#3B82F6", // blue
    "#22C55E", // green
    "#F59E0B", // amber
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#6B7280", // gray
]

interface CategoryData {
    name:  string
    value: number
}

interface ExpenseCategoryChartProps {
    data: CategoryData[]
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const item = payload[0]
        return (
            <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl">
                <p className="text-foreground text-sm font-semibold">{item.name}</p>
                <p className="text-primary font-mono font-bold mt-0.5">
                    {formatCurrency(item.value)}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                    {item.payload.percent ? `${(item.payload.percent * 100).toFixed(1)}%` : ""}
                </p>
            </div>
        )
    }
    return null
}

const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-col gap-2 mt-2">
        {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground truncate">{entry.value}</span>
                </div>
                <span className="text-foreground font-mono shrink-0">
                    {formatCurrency(entry.payload.value)}
                </span>
            </div>
        ))}
    </div>
)

export function ExpenseCategoryChart({ data }: ExpenseCategoryChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-full">
                <ChartHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-3">
                            <PieChartIcon size={20} className="text-primary/30" />
                        </div>
                        <p className="text-muted-foreground text-sm">No data to display</p>
                    </div>
                </div>
            </div>
        )
    }

    // Enrich data with percent for tooltip
    const total = data.reduce((s, d) => s + d.value, 0)
    const enriched = data.map((d) => ({ ...d, percent: total > 0 ? d.value / total : 0 }))

    return (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <ChartHeader />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 flex-1">
                {/* Donut */}
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={enriched}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                        >
                            {enriched.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                    opacity={0.9}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex flex-col justify-center">
                    <CustomLegend
                        payload={enriched.map((d, i) => ({
                            value:   d.name,
                            color:   CHART_COLORS[i % CHART_COLORS.length],
                            payload: d,
                        }))}
                    />
                    <div className="mt-4 pt-3 border-t border-border">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Total</span>
                            <span className="text-primary font-mono font-bold">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ChartHeader() {
    return (
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <PieChartIcon size={14} className="text-primary" />
            </div>
            <div>
                <p className="text-sm font-semibold text-foreground">Category Breakdown</p>
                <p className="text-xs text-muted-foreground">Expense distribution by category</p>
            </div>
        </div>
    )
}
