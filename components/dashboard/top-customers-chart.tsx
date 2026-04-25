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

interface TopCustomersChartProps {
    data: {
        name: string
        value: number
    }[]
}

const COLORS = ["#D4A017", "#B8860B", "#D2B48C", "#DAA520", "#C5B358"]

export function TopCustomersChart({ data }: TopCustomersChartProps) {
    return (
        <div className="w-full h-[350px] bg-card border border-border rounded-2xl p-6">
            <h3 className="text-foreground font-semibold mb-6">Top Customers</h3>
            <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ left: 20, right: 40, top: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.05} horizontal={false} />
                        <XAxis 
                            type="number" 
                            stroke="#A0A0A0" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            tick={(props) => {
                                const { x, y, payload } = props;
                                return (
                                    <text
                                        x={x - 10}
                                        y={y + 4}
                                        fill="#F5F5F5"
                                        textAnchor="end"
                                        className="text-[10px] font-bold dark:fill-[#F5F5F5] fill-[#2C2620]"
                                    >
                                        {payload.value}
                                    </text>
                                );
                            }}
                            tickLine={false} 
                            axisLine={false}
                            width={160}
                        />
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
                                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                                                {payload[0].payload.name}
                                            </p>
                                            <p className="text-sm font-bold text-primary">
                                                ₹{Number(payload[0].value || 0).toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar 
                            dataKey="value" 
                            radius={[0, 4, 4, 0]} 
                            barSize={15}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
