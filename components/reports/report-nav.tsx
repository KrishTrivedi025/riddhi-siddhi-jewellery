"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export type ReportId =
    | "profit_loss" | "sales" | "purchase" | "receivable" | "payable"
    | "cash_bank_book"

interface NavGroup {
    label: string
    items: { id: ReportId; label: string; icon: string }[]
}

const NAV_GROUPS: NavGroup[] = [
    { label: "Financial",       items: [{ id: "profit_loss", label: "Profit & Loss", icon: "📊" }] },
    { label: "Sales & Purchase", items: [
        { id: "sales",      label: "Sales Report",          icon: "🧾" },
        { id: "purchase",   label: "Purchase Report",        icon: "🛒" },
        { id: "receivable", label: "Outstanding Receivable", icon: "📥" },
        { id: "payable",    label: "Outstanding Payable",    icon: "📤" },
    ]},
    { label: "Ledgers",       items: [
        { id: "cash_bank_book", label: "Cash/Bank Book", icon: "🏦" },
    ]},
]

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items)

interface ReportNavProps {
    active: ReportId
    onChange: (id: ReportId) => void
}

export function ReportNav({ active, onChange }: ReportNavProps) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const activeItem = ALL_ITEMS.find(i => i.id === active)

    return (
        <>
            {/* ── Mobile: dropdown selector ── */}
            <div className="md:hidden mb-4">
                <button
                    onClick={() => setMobileOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl text-foreground"
                >
                    <div className="flex items-center gap-2">
                        <span>{activeItem?.icon}</span>
                        <span className="text-sm font-semibold">{activeItem?.label}</span>
                    </div>
                    <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", mobileOpen && "rotate-180")} />
                </button>

                {mobileOpen && (
                    <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden">
                        {NAV_GROUPS.map(group => (
                            <div key={group.label}>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-1">
                                    {group.label}
                                </p>
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { onChange(item.id); setMobileOpen(false) }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-b border-border last:border-0 transition-colors",
                                            item.id === active
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Desktop: sidebar ── */}
            <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1 pr-4 border-r border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">Reports</p>
                {NAV_GROUPS.map(group => (
                    <div key={group.label} className="mb-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                            {group.label}
                        </p>
                        {group.items.map(item => {
                            const isActive = item.id === active
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onChange(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 text-left",
                                        isActive
                                            ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-border border border-transparent"
                                    )}
                                >
                                    <span className="text-base leading-none">{item.icon}</span>
                                    <span className="text-xs">{item.label}</span>
                                </button>
                            )
                        })}
                    </div>
                ))}
            </aside>
        </>
    )
}
