"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface SupplierKhataHeaderProps {
    party: { name: string; phone: string | null }
    netBalance: number
}

export function SupplierKhataHeader({ party, netBalance }: SupplierKhataHeaderProps) {
    const isGet = netBalance > 0
    const isSettled = netBalance === 0

    return (
        <div className="space-y-4">
            <Link
                href="/dashboard/parties?tab=suppliers"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Parties
            </Link>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-primary via-[#F0C040] to-primary" />
                <div className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-primary">
                            {party.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg font-bold text-foreground truncate">{party.name}</h1>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-500/10 border-amber-500/20 text-amber-400">
                                Supplier
                            </span>
                        </div>
                        {party.phone && (
                            <p className="text-xs text-muted-foreground mt-0.5">{party.phone}</p>
                        )}
                    </div>
                </div>
                <div className="border-t border-border px-5 py-3.5 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        {isSettled ? "Settled up" : isGet ? "You will get" : "You will give"}
                    </span>
                    {!isSettled && (
                        <span className={`text-lg font-bold ${isGet ? "text-emerald-500" : "text-rose-500"}`}>
                            ₹{Math.abs(netBalance).toLocaleString("en-IN")}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
