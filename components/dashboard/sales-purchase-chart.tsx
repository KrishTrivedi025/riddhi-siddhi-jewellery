"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"

interface SalesPurchaseChartProps {
    data: {
        month: string
        sales: number
        purchases: number
    }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-4 rounded-xl shadow-2xl">
                <p className="text-foreground font-semibold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.fill }}>
                        {entry.name}: ₹{Number(entry.value || 0).toLocaleString("en-IN")}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export function SalesPurchaseChart({ data }: SalesPurchaseChartProps) {
    return (
        <div className="w-full h-[350px] bg-card border border-border rounded-2xl p-6">
            <h3 className="text-foreground font-semibold mb-6">Sales vs Purchase</h3>
            <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
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
                        <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle"
                            content={({ payload }) => (
                                <div className="flex justify-end gap-4 mb-4">
                                    {payload?.map((entry: any, index: number) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                            <span className="text-xs text-muted-foreground">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                        <Bar 
                            name="Sales" 
                            dataKey="sales" 
                            fill="#D4A017" 
                            radius={[4, 4, 0, 0]} 
                            barSize={20} 
                        />
                        <Bar 
                            name="Purchases" 
                            dataKey="purchases" 
                            fill="#737373" 
                            radius={[4, 4, 0, 0]} 
                            barSize={20} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
