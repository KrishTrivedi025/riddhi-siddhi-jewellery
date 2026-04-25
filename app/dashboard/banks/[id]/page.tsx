import { Suspense } from "react"
import { getBankAccountById } from "@/lib/actions/banks"
import { getAccountTransactions } from "@/lib/actions/transfers"
import { AccountHistoryTable } from "@/components/banks/account-history-table"
import { Button } from "@/components/ui/button"
import { Landmark, Wallet, ChevronLeft, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { formatCurrency } from "@/lib/gst-utils"
import Link from "next/link"
import { notFound } from "next/navigation"

interface AccountPageProps {
    params: Promise<{ id: string }>
}

export default async function AccountDetailPage({ params }: AccountPageProps) {
    const { id } = await params
    const account = await getBankAccountById(id)
    
    if (!account) {
        notFound()
    }

    const transactions = await getAccountTransactions(id)

    const totalIn = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
    
    const totalOut = Math.abs(transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0))

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/banks">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                        <ChevronLeft size={20} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{account.accountName}</h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
                        {account.isCash ? "Cash Ledger" : `${account.bankName || 'Bank'} | ${account.accountNumber || '****'}`}
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        {account.isCash ? <Wallet size={60} /> : <Landmark size={60} />}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Balance</p>
                    <h2 className={`text-2xl font-black tabular-nums ${account.currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(account.currentBalance)}
                    </h2>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <ArrowDownLeft size={60} className="text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Received (In)</p>
                    <h2 className="text-xl font-bold text-emerald-400/80 tabular-nums">
                        {formatCurrency(totalIn)}
                    </h2>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <ArrowUpRight size={60} className="text-rose-400" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Spent (Out)</p>
                    <h2 className="text-xl font-bold text-rose-400/80 tabular-nums">
                        {formatCurrency(totalOut)}
                    </h2>
                </div>
            </div>

            {/* Transactions Table */}
            <AccountHistoryTable transactions={transactions} />
        </div>
    )
}
