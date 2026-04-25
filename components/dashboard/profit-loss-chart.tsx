"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts"

interface ProfitLossChartProps {
    data: {
        month: string
        profit: number
    }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-4 rounded-xl shadow-2xl">
                <p className="text-foreground font-semibold mb-2">{label}</p>
                <p className="text-sm text-primary">
                    Net Profit: ₹{Number(payload[0].value || 0).toLocaleString("en-IN")}
                </p>
            </div>
        )
    }
    return null
}

export function ProfitLossChart({ data }: ProfitLossChartProps) {
    return (
        <div className="w-full h-[350px] bg-card border border-border rounded-2xl p-6">
            <h3 className="text-foreground font-semibold mb-6">Profit Trend</h3>
            <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4A017" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#D4A017" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            stroke="#737373" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                        />
                        <YAxis 
                            stroke="#737373" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="#D4A017" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#profitGradient)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
