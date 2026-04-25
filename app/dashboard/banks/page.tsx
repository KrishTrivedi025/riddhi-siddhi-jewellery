import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { getBankAccounts } from "@/lib/actions/banks"
import { BankTable } from "@/components/banks/bank-table"
import { BankDialog } from "@/components/banks/bank-dialog"
import { TransferDialog } from "@/components/banks/transfer-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Landmark, Wallet, Layers } from "lucide-react"
import { formatCurrency } from "@/lib/gst-utils"

export const metadata = {
    title: "Cash & Bank | Riddhi Siddhi Jewellery",
    description: "Manage your bank accounts and cash in hand balances",
}

export default async function BanksPage() {
    return (
        <PageWrapper className="space-y-8">
            <Suspense fallback={<BanksHeaderSkeleton />}>
                <BanksData />
            </Suspense>
        </PageWrapper>
    )
}

async function BanksData() {
    const accounts = await getBankAccounts()
    
    const bankTotal = accounts
        .filter(a => !a.isCash)
        .reduce((sum, a) => sum + a.currentBalance, 0)
    
    const cashTotal = accounts
        .filter(a => a.isCash)
        .reduce((sum, a) => sum + a.currentBalance, 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Cash & Bank Account</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage physical cash and digital banking ledgers</p>
                </div>
                <div className="flex items-center gap-3">
                    <TransferDialog />
                    <BankDialog />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Landmark size={80} className="text-blue-400" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Bank Balance</p>
                        <h2 className="text-2xl font-black text-blue-400 tabular-nums">{formatCurrency(bankTotal)}</h2>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Wallet size={80} className="text-emerald-400" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Cash In Hand</p>
                        <h2 className="text-2xl font-black text-emerald-400 tabular-nums">{formatCurrency(cashTotal)}</h2>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Layers size={80} className="text-primary" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Liquidity</p>
                        <h2 className="text-2xl font-black text-primary tabular-nums">{formatCurrency(bankTotal + cashTotal)}</h2>
                    </div>
                </div>
            </div>

            {/* Accounts Table */}
            <BankTable accounts={accounts} />
        </div>
    )
}

function BanksHeaderSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-60 bg-muted" />
                    <Skeleton className="h-4 w-80 mt-2 bg-muted" />
                </div>
                <Skeleton className="h-10 w-32 bg-muted" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 bg-muted rounded-xl border border-border" />)}
            </div>
            <Skeleton className="h-[400px] w-full bg-muted rounded-xl border border-border" />
        </div>
    )
}
