"use client"

import { useEffect, useState } from "react"
import { getProfitLossReport } from "@/lib/actions/reports"
import { ReportShell, presetToRange, type DatePreset } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

type ReportData = Awaited<ReturnType<typeof getProfitLossReport>>

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm space-y-1">
            <p className="text-muted-foreground font-semibold mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: {formatCurrency(p.value)}
                </p>
            ))}
        </div>
    )
}

export function ProfitLossReport() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [preset, setPreset] = useState<DatePreset>("this_month")

    async function load(p: DatePreset) {
        setLoading(true)
        const range = presetToRange(p)
        const d = await getProfitLossReport(range)
        setData(d)
        setLoading(false)
    }

    useEffect(() => { load(preset) }, [])

    return (
        <ReportShell
            title="Profit & Loss Statement"
            description="Revenue, costs and net profit"
            icon="📊"
            accentColor="#D4A017"
            preset={preset}
            onPresetChange={(p) => { setPreset(p); load(p) }}
        >
            {loading && <Skeleton />}
            {!loading && data && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard label="Total Revenue"   value={data.totalRevenue}   color="text-emerald-400" icon={<TrendingUp size={16}/>} bg="bg-emerald-500/10 border-emerald-500/20" />
                        <KPICard label="Total Purchases" value={data.totalCOGS}      color="text-blue-400"    icon={<Minus size={16}/>}       bg="bg-blue-500/10 border-blue-500/20" />
                        <KPICard label="Total Expenses"  value={data.totalExpenses}  color="text-rose-400"    icon={<Minus size={16}/>}       bg="bg-rose-500/10 border-rose-500/20" />
                        <KPICard
                            label="Net Profit"
                            value={data.netProfit}
                            color={data.netProfit >= 0 ? "text-primary" : "text-rose-400"}
                            icon={data.netProfit >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                            bg={data.netProfit >= 0 ? "bg-primary/10 border-primary/20" : "bg-rose-500/10 border-rose-500/20"}
                        />
                    </div>

                    {/* P&L Summary Table */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-border">
                            <p className="text-sm font-semibold text-foreground">Income & Expenditure</p>
                        </div>
                        <div className="divide-y divide-border">
                            <Row label="Sales Revenue"     value={data.totalRevenue}  color="text-emerald-400" indent={false} />
                            <Row label="GST Collected"     value={data.totalGstOut}   color="text-emerald-300" indent={true} />
                            <Row label="Cost of Purchases" value={-data.totalCOGS}    color="text-blue-400"    indent={false} />
                            <Row label="GST Input (Purchases)" value={data.totalGstIn} color="text-blue-300"   indent={true} />
                            <Row label="Gross Profit"      value={data.grossProfit}   color={data.grossProfit >= 0 ? "text-primary" : "text-rose-400"} indent={false} bold />
                            {data.expenseBreakdown.map(e => (
                                <Row key={e.name} label={e.name} value={-e.value} color="text-rose-400" indent={true} />
                            ))}
                            <Row label="GST ITC on Expenses" value={data.expenseGstITC} color="text-emerald-300" indent={true} />
                            <Row label="Net Profit / Loss" value={data.netProfit} color={data.netProfit >= 0 ? "text-emerald-400" : "text-rose-500"} indent={false} bold />
                        </div>
                    </div>

                    {/* Monthly Trend */}
                    {data.monthly.length > 1 && (
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <p className="text-sm font-semibold text-foreground mb-4">Monthly Trend</p>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={data.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25}/>
                                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4A017" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#D4A017" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false}/>
                                    <XAxis dataKey="month" tick={{ fill: "#A0A0A0", fontSize: 11 }} axisLine={false} tickLine={false}/>
                                    <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} axisLine={false} tickLine={false} width={52}
                                        tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}/>
                                    <Tooltip content={<CustomTooltip/>} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#A0A0A0" }}/>
                                    <Area name="Revenue" type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} fill="url(#revGrad)"/>
                                    <Area name="Profit"  type="monotone" dataKey="profit"  stroke="#D4A017" strokeWidth={2} fill="url(#profGrad)"/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </ReportShell>
    )
}

function KPICard({ label, value, color, icon, bg }: { label: string; value: number; color: string; icon: React.ReactNode; bg: string }) {
    return (
        <div className={`bg-card border rounded-2xl p-4 ${bg}`}>
            <div className={`flex items-center gap-2 mb-1 ${color}`}>{icon}<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p></div>
            <p className={`text-xl font-black tabular-nums ${color}`}>{formatCurrency(Math.abs(value))}</p>
        </div>
    )
}

function Row({ label, value, color, indent, bold }: { label: string; value: number; color: string; indent: boolean; bold?: boolean }) {
    return (
        <div className={`flex items-center justify-between px-5 py-3 ${bold ? "bg-background" : ""}`}>
            <span className={`text-sm ${indent ? "pl-4 text-muted-foreground" : "text-foreground"} ${bold ? "font-bold" : ""}`}>{label}</span>
            <span className={`font-mono text-sm ${color} ${bold ? "font-bold text-base" : ""}`}>
                {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
            </span>
        </div>
    )
}

function Skeleton() {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-card rounded-2xl border border-border animate-pulse"/>)}</div>
}
