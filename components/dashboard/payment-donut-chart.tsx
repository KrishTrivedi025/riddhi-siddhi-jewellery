"use client"

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts"

interface PaymentDonutChartProps {
    data: {
        name: string
        value: number
        color: string
    }[]
}

export function PaymentDonutChart({ data }: PaymentDonutChartProps) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0)

    return (
        <div className="w-full h-[350px] bg-card border border-border rounded-2xl p-6">
            <h3 className="text-foreground font-semibold mb-6">Receivable Status</h3>
            <div className="w-full h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
                                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                                                {payload[0].name}
                                            </p>
                                            <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
                                                ₹{Number(payload[0].value || 0).toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            align="center"
                            iconType="circle"
                            content={({ payload }) => (
                                <div className="flex flex-col gap-2 mt-4">
                                    {payload?.map((entry: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                <span className="text-xs text-muted-foreground">{entry.value}</span>
                                            </div>
                                            <span className="text-xs font-medium text-foreground">
                                                {((entry.payload.value / total) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center text for Donut */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-[60px] flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Total</p>
                    <p className="text-sm font-bold text-foreground">₹{(total/1000).toFixed(1)}k</p>
                </div>
            </div>
        </div>
    )
}
