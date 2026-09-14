"use client"

import { isSameDay, isToday, isYesterday, format } from "date-fns"
import { motion } from "framer-motion"
import { containerFastVariants, itemVariants } from "@/lib/animations"
import { SupplierTransactionCard } from "./supplier-transaction-card"
import type { SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"

interface SupplierTransactionListProps {
    transactions: SupplierTransactionWithBalance[]
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

export function SupplierTransactionList({ transactions }: SupplierTransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="border border-border rounded-xl p-12 text-center">
                <p className="text-muted-foreground italic">Record your first transaction</p>
            </div>
        )
    }

    const groups = groupByDate(transactions)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Entries</span>
                <div className="flex gap-4">
                    <span className="w-14 text-right">You gave</span>
                    <span className="w-14 text-right">You got</span>
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
                                <SupplierTransactionCard transaction={t} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            ))}
        </div>
    )
}
