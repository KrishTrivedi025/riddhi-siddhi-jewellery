"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts"
import { formatCurrency } from "@/lib/gst-utils"
import { BarChart2 } from "lucide-react"

interface MonthData {
    month:  string
    amount: number
}

interface ExpenseTrendChartProps {
    data: MonthData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl">
                <p className="text-muted-foreground text-xs mb-1">{label}</p>
                <p className="text-rose-400 font-mono font-bold text-base">
                    {formatCurrency(payload[0].value)}
                </p>
            </div>
        )
    }
    return null
}

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
    const maxAmount = Math.max(...data.map((d) => d.amount), 1)
    const currentMonth = data[data.length - 1]?.month

    if (!data || data.length === 0) {
        return (
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-full">
                <ChartHeader />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No data to display</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <ChartHeader />

            <div className="mt-6 flex-1">
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                        data={data}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                        barCategoryGap="30%"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#2A2A2A"
                        />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: "#A0A0A0", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "#A0A0A0", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) =>
                                v >= 100000
                                    ? `₹${(v / 100000).toFixed(1)}L`
                                    : v >= 1000
                                    ? `₹${(v / 1000).toFixed(0)}K`
                                    : `₹${v}`
                            }
                            width={52}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2A2A2A" }} />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {data.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        entry.month === currentMonth
                                            ? "#EF4444"      // current month — brighter
                                            : "#EF4444"
                                    }
                                    opacity={entry.month === currentMonth ? 0.9 : 0.45 + (i / data.length) * 0.4}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Trend summary */}
            <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-xs text-muted-foreground">This Month</p>
                    <p className="text-rose-400 font-mono font-bold text-sm mt-0.5">
                        {formatCurrency(data[data.length - 1]?.amount ?? 0)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">6-Month Total</p>
                    <p className="text-primary font-mono font-bold text-sm mt-0.5">
                        {formatCurrency(data.reduce((s, d) => s + d.amount, 0))}
                    </p>
                </div>
            </div>
        </div>
    )
}

function ChartHeader() {
    return (
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <BarChart2 size={14} className="text-rose-400" />
            </div>
            <div>
                <p className="text-sm font-semibold text-foreground">Monthly Trend</p>
                <p className="text-xs text-muted-foreground">Expense outflow — last 6 months</p>
            </div>
        </div>
    )
}
