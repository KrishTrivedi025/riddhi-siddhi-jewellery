"use client"

import { useState, useMemo } from "react"
import { ItemTable } from "./item-table"
import { ItemDialog } from "./item-dialog"
import { CategoryDialog } from "./category-dialog"
import { StockSummaryCards } from "./stock-summary-cards"
import { useT } from "@/lib/i18n/client"
import { Package, AlertTriangle, XCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnimatedTabs } from "@/components/shared/animated-tabs"

interface InventoryContentProps {
    items: any[]
    categories: any[]
}

type TabKey = "all" | "low" | "out"

export function InventoryContent({ items, categories }: InventoryContentProps) {
    const { t } = useT("inventory")
    const [activeTab, setActiveTab] = useState<TabKey>("all")
    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = 
                item.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
                item.category?.name?.toLowerCase().includes(search.toLowerCase());
            
            const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });
    }, [items, search, categoryFilter]);

    const dynamicSummary = useMemo(() => {
        const totalItems = filteredItems.length
        let totalStockValueCost = 0
        let totalStockValueSale = 0
        let lowStockCount = 0
        let outOfStockCount = 0

        filteredItems.forEach(item => {
            totalStockValueCost += item.currentStock * item.purchasePrice
            totalStockValueSale += item.currentStock * item.salePrice
            if (item.currentStock <= 0) outOfStockCount++
            else if (item.lowStockAlert > 0 && item.currentStock <= item.lowStockAlert) lowStockCount++
        })

        return { totalItems, totalStockValueCost, totalStockValueSale, lowStockCount, outOfStockCount }
    }, [filteredItems])

    const lowStockItems = filteredItems.filter(item => item.lowStockAlert > 0 && item.currentStock <= item.lowStockAlert && item.currentStock > 0)
    const outOfStockItems = filteredItems.filter(item => item.currentStock <= 0)

    const tabs = [
        {
            id: "all",
            label: t("allItems"),
            count: filteredItems.length,
            icon: <Package size={14} />,
            activeColorClass: "bg-primary/10 border-primary/40 text-primary",
        },
        {
            id: "low",
            label: t("lowStock"),
            count: lowStockItems.length,
            icon: <AlertTriangle size={14} />,
            activeColorClass: "bg-amber-500/10 border-amber-500/40 text-amber-500",
        },
        {
            id: "out",
            label: t("outOfStock"),
            count: outOfStockItems.length,
            icon: <XCircle size={14} />,
            activeColorClass: "bg-red-500/10 border-red-500/40 text-red-500",
        },
    ]

    const displayItems =
        activeTab === "low" ? lowStockItems : activeTab === "out" ? outOfStockItems : filteredItems

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-3">
                    <CategoryDialog categories={categories} />
                    <ItemDialog categories={categories} />
                </div>
            </div>

            {/* KPI Cards */}
            <StockSummaryCards summary={dynamicSummary} />

            {/* Filters and Search Bar */}
            <div className="flex items-center gap-4 mt-6 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by code or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px] bg-card border-border text-foreground">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Custom Animated Tabs */}
            <AnimatedTabs 
                tabs={tabs} 
                activeTab={activeTab} 
                onChange={(id) => setActiveTab(id as TabKey)} 
                layoutIdPrefix="inventory"
            />

            {/* Table */}
            <ItemTable data={displayItems} categories={categories} />
        </>
    )
}
