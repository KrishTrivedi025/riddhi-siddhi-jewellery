"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, AlertTriangle, ArrowUpDown, History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteItem } from "@/lib/actions/items"
import { ItemDialog } from "./item-dialog"
import { StockAdjustDialog } from "./stock-adjust-dialog"
import { StockHistoryDialog } from "./stock-history-dialog"
import { Image as ImageIcon } from "lucide-react"
import { useConfirm } from "@/components/shared/confirm-provider"

interface ItemTableProps {
    data: any[]
    categories: any[]
}

export function ItemTable({ data, categories }: ItemTableProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const router = useRouter()
    const confirm = useConfirm()

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: "Delete this item?",
            description: "This item will be removed from inventory.",
            confirmText: "Delete",
            variant: "destructive",
        })
        if (!ok) return
        setLoadingId(id)
        try {
            const result = await deleteItem(id)
            if (result.success) {
                toast.success("Item deleted")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Failed to delete item")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="w-[60px] text-center">Photo</TableHead>
                            <TableHead className="text-muted-foreground w-[20%]">Item Code</TableHead>
                            <TableHead className="text-muted-foreground w-[15%]">Category</TableHead>
                            <TableHead className="text-muted-foreground w-[15%] text-right">Stock</TableHead>
                            <TableHead className="text-muted-foreground w-[20%] text-right">Production ₹</TableHead>
                            <TableHead className="text-muted-foreground w-[20%] text-right">Sale ₹</TableHead>
                            <TableHead className="w-[5%]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                                    No items found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => {
                                const isLowStock = item.lowStockAlert > 0 && item.currentStock <= item.lowStockAlert
                                const isOutOfStock = item.currentStock <= 0

                                return (
                                    <TableRow key={item.id} className="border-border hover:bg-muted transition-colors">
                                        <TableCell align="center">
                                            {item.imageUrl ? (
                                                <div className="w-10 h-10 rounded-md overflow-hidden bg-background border border-border">
                                                    <img src={item.imageUrl} alt="Item" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground">
                                                    <ImageIcon size={16} />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground font-mono">
                                            {item.itemCode}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {item.category?.name || "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {(isLowStock || isOutOfStock) && (
                                                    <AlertTriangle size={12} className={isOutOfStock ? "text-rose-500" : "text-amber-500"} />
                                                )}
                                                <span className={isOutOfStock ? "text-rose-500" : isLowStock ? "text-amber-500" : "text-foreground"}>
                                                    {item.currentStock.toLocaleString("en-IN")}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">{item.unit}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            ₹{item.purchasePrice.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="text-right text-emerald-500 text-sm font-medium">
                                            ₹{item.salePrice.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                                    <StockAdjustDialog item={item} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer hover:bg-border"><ArrowUpDown size={14} className="text-primary" /> Adjust Stock</DropdownMenuItem>} />
                                                    <StockHistoryDialog item={item} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer hover:bg-border"><History size={14} className="text-[#3B82F6]" /> View History</DropdownMenuItem>} />
                                                    <DropdownMenuSeparator className="bg-border" />
                                                    <ItemDialog initialData={item} categories={categories} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer hover:bg-border"><Edit size={14} /> Edit</DropdownMenuItem>} />
                                                    <DropdownMenuItem onClick={() => handleDelete(item.id)} disabled={loadingId === item.id} className="flex items-center gap-2 text-rose-500 cursor-pointer hover:bg-rose-500/10">{loadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {data.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">
                        No items found
                    </div>
                ) : (
                    data.map((item) => {
                        const isLowStock = item.lowStockAlert > 0 && item.currentStock <= item.lowStockAlert
                        const isOutOfStock = item.currentStock <= 0

                        return (
                            <div key={item.id} className="rounded-xl border border-border bg-card p-4 flex gap-4 relative">
                                {/* Photo */}
                                <div className="shrink-0">
                                    {item.imageUrl ? (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-background border border-border">
                                            <img src={item.imageUrl} alt="Item" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono font-medium text-foreground truncate">{item.itemCode}</p>
                                            <p className="text-xs text-muted-foreground truncate">{item.category?.name || "Uncategorized"}</p>
                                        </div>
                                        {/* Actions Menu */}
                                        <div className="-mt-1 -mr-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                                    <StockAdjustDialog item={item} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer hover:bg-border"><ArrowUpDown size={14} className="text-primary" /> Adjust Stock</DropdownMenuItem>} />
                                                    <StockHistoryDialog item={item} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer hover:bg-border"><History size={14} className="text-[#3B82F6]" /> View History</DropdownMenuItem>} />
                                                    <DropdownMenuSeparator className="bg-border" />
                                                    <ItemDialog initialData={item} categories={categories} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer hover:bg-border"><Edit size={14} /> Edit</DropdownMenuItem>} />
                                                    <DropdownMenuItem onClick={() => handleDelete(item.id)} disabled={loadingId === item.id} className="flex items-center gap-2 text-rose-500 cursor-pointer hover:bg-rose-500/10">{loadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Pricing & Stock */}
                                    <div className="flex justify-between items-end mt-2">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sale Price</p>
                                            <p className="text-sm font-semibold text-emerald-500">₹{item.salePrice.toLocaleString("en-IN")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Stock</p>
                                            <div className="flex items-center justify-end gap-1">
                                                {(isLowStock || isOutOfStock) && (
                                                    <AlertTriangle size={12} className={isOutOfStock ? "text-rose-500" : "text-amber-500"} />
                                                )}
                                                <span className={`text-sm font-bold ${isOutOfStock ? "text-rose-500" : isLowStock ? "text-amber-500" : "text-foreground"}`}>
                                                    {item.currentStock.toLocaleString("en-IN")}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">{item.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
