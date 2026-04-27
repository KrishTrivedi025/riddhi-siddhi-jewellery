"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Phone, Mail, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteParty } from "@/lib/actions/parties"
import { PartyDialog } from "./party-dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface PartyTableProps { data: any[] }

export function PartyTable({ data }: PartyTableProps) {
    const [search, setSearch] = useState("")
    const router = useRouter()

    const filteredData = data.filter(party =>
        party.name.toLowerCase().includes(search.toLowerCase()) ||
        party.phone?.includes(search) ||
        party.gstin?.toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = async (id: string) => {
        if (confirm("Delete this party?")) await deleteParty(id)
    }

    return (
        <div className="space-y-4">
            <Input
                placeholder="Search by name, phone or GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />

            {filteredData.length === 0 ? (
                <div className="border border-border rounded-xl p-12 text-center">
                    <p className="text-muted-foreground italic">No parties found</p>
                </div>
            ) : (
                <>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {filteredData.map((party) => (
                            <div key={party.id} className="bg-card border border-border rounded-xl p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <Link href={`/dashboard/parties/${party.id}`}
                                            className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                                            {party.name}
                                        </Link>
                                        {party.city && <span className="ml-2 text-xs text-muted-foreground">({party.city})</span>}
                                    </div>
                                    <div className={`text-sm font-bold shrink-0 ${party.balanceType === "debit" ? "text-emerald-500" : "text-rose-500"}`}>
                                        ₹{party.openingBalance.toLocaleString("en-IN")}
                                        <span className="ml-1 text-[10px] uppercase opacity-60">{party.balanceType === "debit" ? "Dr" : "Cr"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        {party.phone && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Phone size={11} /> {party.phone}
                                            </div>
                                        )}
                                        {party.gstin && (
                                            <p className="text-xs font-mono text-primary">{party.gstin}</p>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/parties/${party.id}`} className="flex items-center gap-2 cursor-pointer hover:bg-border px-2 py-1.5 text-sm">
                                                    <BookOpen size={14} className="text-primary" /> View Ledger
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-border" />
                                            <PartyDialog initialData={party}
                                                trigger={
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer hover:bg-border">
                                                        <Edit size={14} /> Edit
                                                    </DropdownMenuItem>
                                                }
                                            />
                                            <DropdownMenuItem onClick={() => handleDelete(party.id)} className="flex items-center gap-2 text-rose-500 cursor-pointer hover:bg-rose-500/10">
                                                <Trash2 size={14} /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="text-muted-foreground">Party Name</TableHead>
                                    <TableHead className="text-muted-foreground">Contact</TableHead>
                                    <TableHead className="text-muted-foreground">GSTIN</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Balance</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((party) => (
                                    <TableRow key={party.id} className="border-border hover:bg-muted transition-colors">
                                        <TableCell className="font-medium text-foreground">
                                            <div>
                                                <Link href={`/dashboard/parties/${party.id}`} className="hover:text-primary transition-colors">
                                                    {party.name}
                                                </Link>
                                                {party.city && <span className="ml-2 text-xs text-muted-foreground">({party.city})</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {party.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone size={12} /> {party.phone}</div>}
                                                {party.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail size={12} /> {party.email}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-primary">{party.gstin || "—"}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            <div className={party.balanceType === "debit" ? "text-emerald-500" : "text-rose-500"}>
                                                ₹{party.openingBalance.toLocaleString("en-IN")}
                                                <span className="ml-1 text-[10px] uppercase opacity-60">{party.balanceType === "debit" ? "Dr" : "Cr"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/parties/${party.id}`} className="flex items-center gap-2 cursor-pointer hover:bg-border px-2 py-1.5 text-sm">
                                                            <BookOpen size={14} className="text-primary" /> View Ledger
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border" />
                                                    <PartyDialog initialData={party}
                                                        trigger={
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer hover:bg-border">
                                                                <Edit size={14} /> Edit
                                                            </DropdownMenuItem>
                                                        }
                                                    />
                                                    <DropdownMenuItem onClick={() => handleDelete(party.id)} className="flex items-center gap-2 text-rose-500 cursor-pointer hover:bg-rose-500/10">
                                                        <Trash2 size={14} /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    )
}
