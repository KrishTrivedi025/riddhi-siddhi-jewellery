"use client"

import Link from "next/link"
import { format } from "date-fns"
import {
  FilePlus, ShoppingBag, PlusCircle, BarChart2,
  ArrowDownLeft, ArrowUpRight, Receipt,
  TrendingUp, TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomNav } from "./bottom-nav"

interface MobileDashboardProps {
  data: any
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  "Sale":     { icon: ArrowDownLeft, color: "text-[#D4A017]", bg: "bg-[#D4A017]/10" },
  "Purchase": { icon: ArrowUpRight,  color: "text-rose-400",  bg: "bg-rose-500/10"  },
  "Payment":  { icon: Receipt,       color: "text-blue-400",  bg: "bg-blue-500/10"  },
}

const STATUS_CONFIG: Record<string, string> = {
  "paid":           "bg-emerald-500/10 text-emerald-400",
  "completed":      "bg-emerald-500/10 text-emerald-400",
  "unpaid":         "bg-rose-500/10 text-rose-400",
  "partially_paid": "bg-amber-500/10 text-amber-400",
}

export function MobileDashboard({ data }: MobileDashboardProps) {
  const { stats, transactions } = data

  const kpiCards = [
    { label: "Today's Sales",  value: stats.totalSales,      color: "text-[#D4A017]",  highlight: true },
    { label: "Receivable",     value: stats.totalReceivable, color: "text-emerald-400", highlight: false },
    { label: "Payable",        value: stats.totalPayable,    color: "text-rose-400",    highlight: false },
    { label: "Cash Balance",   value: stats.cashBalance,     color: "text-zinc-100",    highlight: false },
  ]

  const quickActions = [
    { label: "New Invoice",  href: "/dashboard/sales/new",       icon: FilePlus,    color: "text-[#D4A017]" },
    { label: "New Purchase", href: "/dashboard/purchases/new",   icon: ShoppingBag, color: "text-zinc-400"  },
    { label: "Add Payment",  href: "/dashboard/payments/in/new", icon: PlusCircle,  color: "text-zinc-400"  },
    { label: "Reports",      href: "/dashboard/reports",         icon: BarChart2,   color: "text-zinc-400"  },
  ]

  return (
    <div className="flex flex-col gap-5 pb-28">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Dashboard</h2>
        <p className="text-xs text-zinc-500">{format(new Date(), "dd MMMM yyyy")}</p>
      </div>

      {/* KPI Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
        {kpiCards.map((card, i) => (
          <div
            key={i}
            className={cn(
              "min-w-[150px] flex-shrink-0 rounded-xl p-4 flex flex-col justify-between h-24",
              "bg-gradient-to-br from-[#241F16]/80 to-[#17130A]/90 border border-[#2A2A2A]",
              card.highlight && "border-t-[#D4A017]/40 border-t-2"
            )}
          >
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              {card.label}
            </span>
            <span className={cn("text-2xl font-light tracking-tight", card.color)}>
              ₹{(card.value || 0).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      {/* Net Profit Banner */}
      <div className={cn(
        "rounded-xl p-3 flex items-center justify-between border",
        (stats.netProfit || 0) >= 0
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-rose-500/5 border-rose-500/20"
      )}>
        <div className="flex items-center gap-2">
          {(stats.netProfit || 0) >= 0
            ? <TrendingUp size={16} className="text-emerald-400" />
            : <TrendingDown size={16} className="text-rose-400" />
          }
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Net Profit</span>
        </div>
        <span className={cn(
          "text-base font-semibold",
          (stats.netProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
        )}>
          ₹{Math.abs(stats.netProfit || 0).toLocaleString("en-IN")}
        </span>
      </div>

      {/* Quick Actions 2x2 Grid */}
      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href}>
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-transform">
                <action.icon size={28} className={action.color} />
                <span className="text-sm font-semibold text-zinc-100 text-center leading-tight">
                  {action.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Recent Transactions
          </h3>
          <Link href="/dashboard/sales" className="text-[10px] uppercase tracking-widest text-[#D4A017] font-bold">
            View All
          </Link>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-500 text-sm italic">No recent transactions</p>
            </div>
          ) : (
            transactions.slice(0, 5).map((tx: any, i: number) => {
              const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG["Sale"]
              const Icon = config.icon
              return (
                <div
                  key={tx.id}
                  className={cn(
                    "flex items-center justify-between p-4",
                    i < Math.min(transactions.length, 5) - 1 && "border-b border-[#2A2A2A]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.bg)}>
                      <Icon size={16} className={config.color} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100 leading-tight">{tx.partyName}</p>
                      <p className="text-[11px] text-zinc-500">{tx.referenceNumber} · {format(new Date(tx.date), "dd MMM")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-semibold", tx.type === "Sale" ? "text-[#D4A017]" : "text-rose-400")}>
                      {tx.type === "Sale" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                    </p>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", STATUS_CONFIG[tx.status || "unpaid"])}>
                      {tx.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  )
}
