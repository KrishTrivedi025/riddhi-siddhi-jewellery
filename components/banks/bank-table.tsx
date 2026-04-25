"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash, Landmark, Wallet, CheckCircle2, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/gst-utils"
import { BankDialog } from "./bank-dialog"
import { deleteBankAccount } from "@/lib/actions/banks"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BankTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accounts: any[]
}

export function BankTable({ accounts }: BankTableProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const router = useRouter()

    const onDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("Are you sure you want to delete this account?")) return
        
        setLoadingId(id)
        try {
            const result = await deleteBankAccount(id)
            if (result.success) {
                toast.success("Account deleted")
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Failed to delete account")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="border-border hover:bg-transparent bg-muted/50">
                        <TableHead className="text-muted-foreground text-xs uppercase">Account Name</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase">Bank Info</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase text-right">Opening Balance</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase text-right">Current Balance</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase w-20"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.length === 0 ? (
                        <TableRow className="border-border">
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                No accounts found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        accounts.map((acc) => (
                            <TableRow 
                                key={acc.id} 
                                onClick={() => router.push(`/dashboard/banks/${acc.id}`)}
                                className="border-border hover:bg-muted/30 transition-colors cursor-pointer group"
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${acc.isCash ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {acc.isCash ? <Wallet size={16} /> : <Landmark size={16} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                                {acc.accountName}
                                                {acc.isDefault && (
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                                {acc.isCash ? 'Cash Account' : 'Bank Account'}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {!acc.isCash ? (
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-foreground">{acc.bankName || 'N/A'}</p>
                                            <p className="text-[10px] text-muted-foreground">{acc.accountNumber || '****'}</p>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm tabular-nums">
                                    {formatCurrency(acc.openingBalance)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`text-sm font-bold tabular-nums ${acc.currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatCurrency(acc.currentBalance)}
                                    </span>
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card border-border text-foreground font-medium">
                                            <BankDialog 
                                                initialData={acc} 
                                                trigger={
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Account
                                                    </DropdownMenuItem>
                                                }
                                                onSuccess={() => router.refresh()} 
                                            />
                                            {!acc.isCash && (
                                                <DropdownMenuItem 
                                                    className="text-rose-400 focus:text-rose-400 cursor-pointer"
                                                    onClick={(e) => onDelete(acc.id, e)}
                                                >
                                                    {loadingId === acc.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                                                    Delete Account
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
