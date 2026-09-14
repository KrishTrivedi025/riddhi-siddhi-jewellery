"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { containerFastVariants, itemVariants } from "@/lib/animations"
import { SupplierKhataSummary } from "./supplier-khata-summary"
import type { SupplierKhataSummary as SupplierKhataSummaryData } from "@/lib/actions/supplier-transactions"

interface SupplierKhataListProps {
    summary: SupplierKhataSummaryData
}

export function SupplierKhataList({ summary }: SupplierKhataListProps) {
    const [search, setSearch] = useState("")

    const filtered = summary.suppliers.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.phone || "").includes(search)
    )

    return (
        <div className="space-y-4">
            <SupplierKhataSummary summary={summary} />

            <Input
                placeholder="Search Supplier"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />

            {filtered.length === 0 ? (
                <div className="border border-border rounded-xl p-12 text-center">
                    <p className="text-muted-foreground italic">
                        {summary.suppliers.length === 0
                            ? "No suppliers yet — add your first one"
                            : "No matching suppliers"}
                    </p>
                </div>
            ) : (
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={containerFastVariants}
                    className="space-y-2 pb-24 md:pb-4"
                >
                    {filtered.map((supplier) => (
                        <motion.div key={supplier.id} variants={itemVariants}>
                            <Link
                                href={`/dashboard/parties/${supplier.id}`}
                                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/40 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                                        {supplier.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {supplier.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {supplier.lastActivity
                                                ? `${formatDistanceToNowStrict(supplier.lastActivity)} ago`
                                                : "No transactions yet"}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={`text-sm font-bold shrink-0 ${
                                        supplier.netBalance === 0
                                            ? "text-muted-foreground"
                                            : supplier.netBalance > 0
                                            ? "text-emerald-500"
                                            : "text-rose-500"
                                    }`}
                                >
                                    ₹{Math.abs(supplier.netBalance).toLocaleString("en-IN")}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
