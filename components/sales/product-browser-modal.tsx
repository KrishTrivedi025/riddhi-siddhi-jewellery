"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Package, Search, Image as ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ProductBrowserModalProps {
    inventoryItems: any[]
    onSelect: (item: any) => void
    children: React.ReactNode
}

export function ProductBrowserModal({ inventoryItems, onSelect, children }: ProductBrowserModalProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState<string>("all")

    // Extract unique categories
    const categories = useMemo(() => {
        const catMap = new Map()
        inventoryItems.forEach(item => {
            if (item.category) {
                catMap.set(item.category.id, item.category)
            }
        })
        return Array.from(catMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))
    }, [inventoryItems])

    // Filter items
    const displayItems = useMemo(() => {
        return inventoryItems.filter(item => {
            const matchesSearch = item.itemCode?.toLowerCase().includes(search.toLowerCase()) || 
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-6xl sm:max-w-6xl h-[85vh] flex flex-col bg-card border-border p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border bg-card">
                    <DialogTitle className="text-foreground flex items-center justify-between mt-2">
                        <span>Browse Products</span>
                        <div className="relative max-w-xs w-full mr-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by item code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Categories */}
                    <div className="w-56 border-r border-border bg-card overflow-y-auto p-3 space-y-1">
                        <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Categories</div>
                        <button
                            onClick={() => setActiveCategory("all")}
                            className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-xs font-semibold ${
                                activeCategory === "all"
                                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,160,23,0.2)]"
                                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                            }`}
                        >
                            All Products
                        </button>
                        {categories.map((cat: any) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-xs font-semibold ${
                                    activeCategory === cat.id
                                        ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,160,23,0.2)]"
                                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Right Content - Product Grid */}
                    <div className="flex-1 p-4 overflow-y-auto bg-background">
                        {displayItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <Package size={40} className="mb-3 opacity-20" />
                                <p className="text-sm font-medium">No results found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4">
                                {displayItems.map(item => (
                                    <div 
                                        key={item.id} 
                                        className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-[0_0_20px_rgba(212,160,23,0.1)] transition-all cursor-pointer flex flex-col"
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className="aspect-square bg-background relative w-full overflow-hidden">
                                            {item.imageUrl ? (
                                                <img 
                                                    src={item.imageUrl} 
                                                    alt={item.itemCode} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                    <ImageIcon size={24} className="text-border" />
                                                    <span className="text-[10px] text-muted-foreground font-mono">{item.itemCode}</span>
                                                </div>
                                            )}
                                            
                                            {/* Top Overlay Badge */}
                                            <div className="absolute top-2 left-2">
                                                <Badge variant="outline" className="bg-black/40 backdrop-blur-md border-white/20 text-white text-[9px] h-5 px-1.5 font-mono">
                                                    {item.itemCode}
                                                </Badge>
                                            </div>

                                            {item.currentStock <= 0 && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] z-10">
                                                    <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-widest">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-2.5 flex flex-col gap-1.5 bg-gradient-to-t from-card to-muted">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-muted-foreground font-medium truncate">
                                                    {item.category?.name || "Uncategorized"}
                                                </span>
                                                <span className="text-emerald-500 font-bold text-xs">
                                                    ₹{(item.salePrice || 0).toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.currentStock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {item.currentStock} {item.unit}
                                                    </span>
                                                </div>
                                                <button className="text-[9px] font-bold text-primary hover:underline uppercase tracking-tighter">
                                                    Select
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
