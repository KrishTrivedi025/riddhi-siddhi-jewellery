"use client"

import { isSameDay, isToday, isYesterday, format } from "date-fns"
import { motion } from "framer-motion"
import { Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { containerFastVariants, itemVariants } from "@/lib/animations"
import { SupplierTransactionCard } from "./supplier-transaction-card"
import type { SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"

interface SupplierTransactionListProps {
    transactions: SupplierTransactionWithBalance[]
    onEdit: (transaction: SupplierTransactionWithBalance) => void
    onAddFirst: () => void
}

interface DateGroup {
    key: string
    label: string
    entries: SupplierTransactionWithBalance[]
}

function groupByDate(transactions: SupplierTransactionWithBalance[]): DateGroup[] {
    const groups: DateGroup[] = []
    for (const t of transactions) {
        const last = groups[groups.length - 1]
        if (last && isSameDay(last.entries[0].date, t.date)) {
            last.entries.push(t)
        } else {
            const label = isToday(t.date)
                ? `${format(t.date, "d MMM yy")} • Today`
                : isYesterday(t.date)
                ? `${format(t.date, "d MMM yy")} • Yesterday`
                : format(t.date, "d MMM yy")
            groups.push({ key: t.date.toISOString(), label, entries: [t] })
        }
    }
    return groups
}

export function SupplierTransactionList({ transactions, onEdit, onAddFirst }: SupplierTransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="border border-border rounded-xl p-10 text-center space-y-3">
                <Receipt size={28} className="mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">No transactions yet</p>
                <Button variant="outline" size="sm" onClick={onAddFirst}>
                    Record your first transaction
                </Button>
            </div>
        )
    }

    const groups = groupByDate(transactions)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1 pb-2.5 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase">
                <span>Entries</span>
                <div className="flex gap-2">
                    <span className="w-20 text-right whitespace-nowrap">You Gave</span>
                    <span className="w-20 text-right whitespace-nowrap">You Got</span>
                </div>
            </div>

            {groups.map((group) => (
                <div key={group.key} className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">{group.label}</p>
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={containerFastVariants}
                        className="space-y-2"
                    >
                        {group.entries.map((t) => (
                            <motion.div key={t.id} variants={itemVariants}>
                                <SupplierTransactionCard transaction={t} onEdit={onEdit} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            ))}
        </div>
    )
}
