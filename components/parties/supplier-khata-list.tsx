"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNowStrict } from "date-fns"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Loader2, SearchX, Trash2, UserPlus, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useConfirm } from "@/components/shared/confirm-provider"
import { deleteParty } from "@/lib/actions/parties"
import { containerFastVariants, itemVariants } from "@/lib/animations"
import { SupplierKhataSummary } from "./supplier-khata-summary"
import { QuickSupplierDialog } from "./quick-supplier-dialog"
import type { SupplierKhataSummary as SupplierKhataSummaryData } from "@/lib/actions/supplier-transactions"

interface SupplierKhataListProps {
    summary: SupplierKhataSummaryData
}

export function SupplierKhataList({ summary }: SupplierKhataListProps) {
    const [search, setSearch] = useState("")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const router = useRouter()
    const confirm = useConfirm()

    const handleDelete = async (id: string, name: string) => {
        const ok = await confirm({
            title: `Delete ${name}?`,
            description: "This supplier and its khata will be removed from your list.",
            confirmText: "Delete",
            variant: "destructive",
        })
        if (!ok) return
        setDeletingId(id)
        try {
            const result = await deleteParty(id)
            if (result.success) {
                toast.success("Supplier deleted")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Failed to delete supplier")
        } finally {
            setDeletingId(null)
        }
    }

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
                <div className="border border-border rounded-xl p-10 text-center space-y-3">
                    {summary.suppliers.length === 0 ? (
                        <>
                            <Users size={28} className="mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground text-sm">No suppliers yet</p>
                            <QuickSupplierDialog
                                trigger={
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <UserPlus size={14} /> Add your first supplier
                                    </Button>
                                }
                            />
                        </>
                    ) : (
                        <>
                            <SearchX size={28} className="mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground text-sm">No matching suppliers</p>
                        </>
                    )}
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
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/40 transition-colors">
                                <Link
                                    href={`/dashboard/parties/${supplier.id}`}
                                    className="flex items-center gap-3 min-w-0 flex-1"
                                >
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
                                </Link>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        href={`/dashboard/parties/${supplier.id}`}
                                        className={`text-sm font-bold ${
                                            supplier.netBalance === 0
                                                ? "text-muted-foreground"
                                                : supplier.netBalance > 0
                                                ? "text-emerald-500"
                                                : "text-rose-500"
                                        }`}
                                    >
                                        ₹{Math.abs(supplier.netBalance).toLocaleString("en-IN")}
                                    </Link>
                                    {/* A single direct button — no dropdown/portal — so the tap
                                        target can't be confused with navigating into the card. */}
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(supplier.id, supplier.name)}
                                        disabled={deletingId === supplier.id}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                        aria-label={`Delete ${supplier.name}`}
                                    >
                                        {deletingId === supplier.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
