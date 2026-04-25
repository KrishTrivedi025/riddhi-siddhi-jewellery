"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Settings2, Plus, Trash2, Loader2 } from "lucide-react"
import { useState } from "react"
import { createCategory, deleteCategory } from "@/lib/actions/items"

interface CategoryDialogProps {
    categories: any[]
}

export function CategoryDialog({ categories: initialCategories }: CategoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [catList, setCatList] = useState(initialCategories)
    const [newName, setNewName] = useState("")
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleAdd = async () => {
        if (!newName.trim()) return
        setLoading(true)
        try {
            const result = await createCategory(newName.trim())
            if (result.success && result.data) {
                setCatList([...catList, { ...result.data, _count: { items: 0 } }])
                setNewName("")
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const result = await deleteCategory(id)
            if (result.success) {
                setCatList(catList.filter((c: any) => c.id !== id))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground hover:bg-border gap-2"
                >
                    <Settings2 size={14} />
                    Categories
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Manage Categories</DialogTitle>
                </DialogHeader>
                <div className="pt-4 space-y-4">
                    {/* Add new */}
                    <div className="flex gap-2">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="New category name"
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                        />
                        <Button
                            onClick={handleAdd}
                            disabled={loading || !newName.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
                        </Button>
                    </div>

                    {/* List */}
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {catList.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-6">
                                No categories yet
                            </p>
                        ) : (
                            catList.map((cat: any) => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                                >
                                    <div>
                                        <span className="text-sm text-foreground">{cat.name}</span>
                                        <span className="ml-2 text-[10px] text-muted-foreground">
                                            ({cat._count?.items ?? 0} items)
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(cat.id)}
                                        disabled={deletingId === cat.id}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {deletingId === cat.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Trash2 size={13} />
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
