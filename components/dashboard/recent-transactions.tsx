"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ArrowDownLeft, ArrowUpRight, Receipt, LucideIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
    "Sale": { icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-500/5" },
    "Purchase": { icon: ArrowUpRight, color: "text-rose-500", bg: "bg-rose-500/10" },
    "Payment": { icon: Receipt, color: "text-blue-500", bg: "bg-blue-500/10" },
}

const STATUS_CONFIG: Record<string, string> = {
    "paid": "bg-emerald-500/5 text-emerald-600",
    "completed": "bg-emerald-500/5 text-emerald-600",
    "unpaid": "bg-red-500/5 text-red-500",
    "partially_paid": "bg-amber-500/5 text-amber-500",
}

interface RecentTransactionsProps {
    transactions?: any[]
}

const ITEMS_PER_PAGE = 5

export function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
    const [currentPage, setCurrentPage] = useState(0)

    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)
    const paginatedTransactions = transactions.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    )

    const nextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
    const prevPage = () => setCurrentPage((p) => Math.max(0, p - 1))

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-foreground font-semibold">Recent Transactions</h3>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={prevPage} 
                            disabled={currentPage === 0}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-medium text-muted-foreground">
                            {currentPage + 1} / {totalPages}
                        </span>
                        <button 
                            onClick={nextPage} 
                            disabled={currentPage === totalPages - 1}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
            
            <div className="relative overflow-hidden" style={{ height: paginatedTransactions.length > 0 ? paginatedTransactions.length * 73 : 200 }}>
                {transactions.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                        <p className="text-muted-foreground italic">No recent transactions found</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="absolute inset-0 flex flex-col divide-y divide-border"
                        >
                            {paginatedTransactions.map((tx) => {
                                const config = TYPE_CONFIG[tx.type]
                                return (
                                    <div key={tx.id} className="p-4 hover:bg-muted transition-colors flex items-center gap-4 h-[73px]">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.bg)}>
                                            <config.icon size={18} className={config.color} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground font-medium truncate">{tx.partyName}</p>
                                            <p className="text-muted-foreground text-xs uppercase tracking-wider">{tx.referenceNumber}</p>
                                        </div>

                                        <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                            <p className="text-foreground font-semibold text-sm">
                                                ₹{tx.amount.toLocaleString("en-IN")}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold", STATUS_CONFIG[tx.status || "unpaid"])}>
                                                    {tx.status?.replace("_", " ")}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {format(tx.date, "dd MMM")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>  {/* closes: relative overflow-hidden div */}
        </div>    {/* closes: bg-card outer card div */}
    )
}
