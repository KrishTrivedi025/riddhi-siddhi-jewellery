"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Package, Search, Image as ImageIcon, X } from "lucide-react"

interface ProductBrowserModalProps {
    inventoryItems: any[]
    onSelect: (item: any) => void
    children: React.ReactNode
}

export function ProductBrowserModal({ inventoryItems, onSelect, children }: ProductBrowserModalProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState<string>("all")

    const categories = useMemo(() => {
        const catMap = new Map()
        inventoryItems.forEach(item => {
            if (item.category) catMap.set(item.category.id, item.category)
        })
        return Array.from(catMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))
    }, [inventoryItems])

    const displayItems = useMemo(() => {
        return inventoryItems.filter(item => {
            const matchesSearch =
                item.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
                item.name?.toLowerCase().includes(search.toLowerCase())
            const matchesCategory = activeCategory === "all" || item.categoryId === activeCategory
            return matchesSearch && matchesCategory
        })
    }, [inventoryItems, search, activeCategory])

    const handleSelect = (item: any) => {
        onSelect(item)
        setOpen(false)
    }

    return (
        <>
            {/* Trigger */}
            <span onClick={() => setOpen(true)} className="cursor-pointer">{children}</span>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent showCloseButton={false} className="w-[96vw] max-w-lg h-[88vh] flex flex-col bg-card border-border p-0 overflow-hidden rounded-2xl gap-0 sm:max-w-2xl">

                    {/* ── Header ── */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
                        <div className="flex-1 relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                placeholder="Search by item code or name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* ── Category tabs — horizontal scroll ── */}
                    <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none border-b border-border flex-shrink-0">
                        {[{ id: "all", name: "All Products" }, ...categories].map((cat: any) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                    activeCategory === cat.id
                                        ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(212,160,23,0.25)]"
                                        : "bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* ── Product Grid ── */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {displayItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-16">
                                <Package size={36} className="mb-3 opacity-20" />
                                <p className="text-sm font-medium">No products found</p>
                                {search && <p className="text-xs mt-1 opacity-60">Try a different search term</p>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {displayItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        disabled={item.currentStock <= 0}
                                        className="group relative bg-background border border-border rounded-2xl overflow-hidden hover:border-primary hover:shadow-[0_0_20px_rgba(212,160,23,0.12)] transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97]"
                                    >
                                        {/* Product image */}
                                        <div className="aspect-square relative w-full overflow-hidden bg-muted">
                                            {item.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.itemCode}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                                                    <ImageIcon size={20} className="text-border" />
                                                    <span className="text-[10px] text-muted-foreground font-mono">{item.itemCode}</span>
                                                </div>
                                            )}

                                            {/* Code badge */}
                                            <div className="absolute top-2 left-2">
                                                <span className="bg-black/50 backdrop-blur-md text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-white/10">
                                                    {item.itemCode}
                                                </span>
                                            </div>

                                            {/* Out of stock overlay */}
                                            {item.currentStock <= 0 && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-2.5 space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-[10px] text-muted-foreground truncate">{item.category?.name || "—"}</span>
                                                <span className="text-emerald-500 font-bold text-xs flex-shrink-0">
                                                    ₹{(item.salePrice || 0).toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-1">
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.currentStock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                    <span className="text-[10px] text-muted-foreground">{item.currentStock} {item.unit}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-tight">Select</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                </DialogContent>
            </Dialog>
        </>
    )
}
