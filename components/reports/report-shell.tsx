"use client"

import { useState, useCallback } from "react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
         startOfYear, endOfYear, startOfQuarter, endOfQuarter, subDays } from "date-fns"
import { CalendarDays, Printer, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ─── Date Range Presets ───────────────────────────────────────────────────────

const PRESETS = [
    { label: "Today",        value: "today" },
    { label: "This Week",    value: "this_week" },
    { label: "This Month",   value: "this_month" },
    { label: "Last Month",   value: "last_month" },
    { label: "This Quarter", value: "this_quarter" },
    { label: "This Year",    value: "this_year" },
    { label: "All Time",     value: "all_time" },
] as const

export type DatePreset = (typeof PRESETS)[number]["value"]

export function presetToRange(preset: DatePreset): { from: Date; to: Date } {
    const now = new Date()
    switch (preset) {
        case "today":        return { from: new Date(now.setHours(0,0,0,0)), to: new Date(new Date().setHours(23,59,59,999)) }
        case "this_week":    return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
        case "this_month":   return { from: startOfMonth(now), to: endOfMonth(now) }
        case "last_month": { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return { from: startOfMonth(lm), to: endOfMonth(lm) } }
        case "this_quarter": return { from: startOfQuarter(now), to: endOfQuarter(now) }
        case "this_year":    return { from: startOfYear(now), to: endOfYear(now) }
        case "all_time":     return { from: new Date("2020-01-01"), to: new Date(now.getFullYear() + 1, 0, 1) }
    }
}

// ─── Report Shell Props ───────────────────────────────────────────────────────

interface ReportShellProps {
    title: string
    description: string
    icon: string
    accentColor?: string
    preset?: DatePreset
    onPresetChange?: (preset: DatePreset, range: { from: Date; to: Date }) => void
    showDateFilter?: boolean
    children: React.ReactNode
}

export function ReportShell({
    title, description, icon, accentColor = "#D4A017",
    preset = "this_month", onPresetChange,
    showDateFilter = true, children,
}: ReportShellProps) {
    const [currentPreset, setCurrentPreset] = useState<DatePreset>(preset)

    const handlePresetChange = useCallback((val: string) => {
        const p = val as DatePreset
        setCurrentPreset(p)
        onPresetChange?.(p, presetToRange(p))
    }, [onPresetChange])

    const range = presetToRange(currentPreset)

    return (
        <div className="flex flex-col gap-6 flex-1 min-h-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border"
                        style={{ background: `${accentColor}10`, borderColor: `${accentColor}20` }}
                    >
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">{title}</h2>
                        <p className="text-xs text-muted-foreground">
                            {showDateFilter
                                ? `${format(range.from, "dd MMM yyyy")} — ${format(range.to, "dd MMM yyyy")}`
                                : description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap print:hidden">
                    {showDateFilter && (
                        <Select value={currentPreset} onValueChange={handlePresetChange}>
                            <SelectTrigger className="h-8 w-36 text-xs bg-background border-border text-foreground gap-1">
                                <CalendarDays size={12} className="text-muted-foreground shrink-0" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                {PRESETS.map(p => (
                                    <SelectItem key={p.value} value={p.value} className="text-xs text-foreground focus:bg-primary/10 focus:text-primary">
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-border"
                        onClick={() => window.print()}
                    >
                        <Printer size={12} /> Print
                    </Button>
                </div>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-auto print:overflow-visible">{children}</div>
        </div>
    )
}
