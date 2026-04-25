"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { getStockMovementReport, getItemsForFilter } from "@/lib/actions/reports"
import { ReportShell, presetToRange, type DatePreset } from "./report-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ReportData  = Awaited<ReturnType<typeof getStockMovementReport>>
type ItemsList   = Awaited<ReturnType<typeof getItemsForFilter>>

export function StockMovementReport() {
    const [data,    setData]    = useState<ReportData | null>(null)
    const [items,   setItems]   = useState<ItemsList>([])
    const [loading, setLoading] = useState(true)
    const [preset,  setPreset]  = useState<DatePreset>("this_month")
    const [itemId,  setItemId]  = useState("all")

    async function load(p: DatePreset, iid: string) {
        setLoading(true)
        const d = await getStockMovementReport(presetToRange(p), iid)
        setData(d); setLoading(false)
    }

    useEffect(() => {
        getItemsForFilter().then(setItems)
        load(preset, itemId)
    }, [])

    return (
        <ReportShell title="Stock Movement" description="All inventory in/out movements" icon="🔄" accentColor="#8B5CF6"
            preset={preset} onPresetChange={(p) => { setPreset(p); load(p, itemId) }}>
            {/* Item filter */}
            <div className="mb-4">
                <Select value={itemId} onValueChange={v => { setItemId(v); load(preset, v) }}>
                    <SelectTrigger className="h-8 w-56 text-xs bg-background border-border text-foreground">
                        <SelectValue placeholder="All items" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                        <SelectItem value="all" className="text-xs text-foreground focus:bg-primary/10 focus:text-primary">All Items</SelectItem>
                        {items.map(i => (
                            <SelectItem key={i.id} value={i.id} className="text-xs text-foreground focus:bg-primary/10 focus:text-primary">{i.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading && <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>}
            {!loading && data && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Movements</p>
                            <p className="text-lg font-bold font-mono text-foreground">{data.movements.length}</p>
                        </div>
                        <div className="bg-card border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total In</p>
                            <p className="text-lg font-bold font-mono text-emerald-400">+{data.totalIn}</p>
                        </div>
                        <div className="bg-card border border-rose-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Out</p>
                            <p className="text-lg font-bold font-mono text-rose-400">−{data.totalOut}</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["Date & Time","Item","Type","Quantity","Unit","Reason","Reference"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.movements.length === 0 && (
                                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No stock movements in this period</TableCell></TableRow>
                                    )}
                                    {data.movements.map(m => {
                                        const isIn = m.movementType === "in"
                                        return (
                                            <TableRow key={m.id} className="border-border hover:bg-background/60">
                                                <TableCell className="text-muted-foreground text-xs font-mono whitespace-nowrap">{format(new Date(m.createdAt), "dd MMM yy, HH:mm")}</TableCell>
                                                <TableCell className="text-foreground text-sm font-medium">{m.item.name}</TableCell>
                                                <TableCell>
                                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border", isIn ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                                                        {isIn ? "▲ IN" : "▼ OUT"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className={cn("font-mono font-bold text-sm", isIn ? "text-emerald-400" : "text-rose-400")}>
                                                    {isIn ? "+" : "−"}{m.quantity}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{m.item.unit}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs max-w-[160px] truncate">{m.reason || "—"}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs font-mono">{m.referenceId ? m.referenceId.slice(-8).toUpperCase() : "—"}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </ReportShell>
    )
}
