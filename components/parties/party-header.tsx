"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    Edit,
    Building2,
    CreditCard,
    Calendar,
} from "lucide-react"
import Link from "next/link"
import { PartyDialog } from "./party-dialog"

interface Party {
    id: string
    name: string
    partyType: string
    contactPerson: string | null
    phone: string | null
    email: string | null
    gstin: string | null
    pan: string | null
    billingAddress: string | null
    city: string | null
    state: string | null
    pincode: string | null
    paymentTerms: string | null
    notes: string | null
    openingBalance: number
    balanceType: string
    creditLimit: number | null
    createdAt: Date
}

interface PartyHeaderProps {
    party: Party
}

const partyTypeConfig: Record<
    string,
    { label: string; color: string; bg: string }
> = {
    CUSTOMER: {
        label: "Customer",
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
    },
    SUPPLIER: {
        label: "Supplier",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
    },
    BOTH: {
        label: "Customer & Supplier",
        color: "text-purple-400",
        bg: "bg-purple-500/10 border-purple-500/20",
    },
}

export function PartyHeader({ party }: PartyHeaderProps) {
    const typeConfig =
        partyTypeConfig[party.partyType] || partyTypeConfig["CUSTOMER"]
    const addressParts = [
        party.billingAddress,
        party.city,
        party.state,
        party.pincode,
    ].filter(Boolean)
    const fullAddress = addressParts.join(", ")

    return (
        <div className="space-y-4">
            {/* Back navigation */}
            <Link
                href="/dashboard/parties"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
                <ArrowLeft
                    size={16}
                    className="group-hover:-translate-x-1 transition-transform"
                />
                Back to Parties
            </Link>

            {/* Header card */}
            <Card className="bg-card border-border overflow-hidden">
                {/* Gold top accent */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-[#F0C040] to-primary" />
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Left: Party info */}
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-xl font-bold text-primary">
                                    {party.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {party.name}
                                    </h1>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConfig.bg} ${typeConfig.color}`}
                                    >
                                        {typeConfig.label}
                                    </span>
                                </div>
                                {party.contactPerson && (
                                    <p className="text-sm text-muted-foreground">
                                        Contact: {party.contactPerson}
                                    </p>
                                )}

                                {/* Contact details */}
                                <div className="flex flex-wrap gap-4 mt-3">
                                    {party.phone && (
                                        <a
                                            href={`tel:${party.phone}`}
                                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Phone size={14} />
                                            {party.phone}
                                        </a>
                                    )}
                                    {party.email && (
                                        <a
                                            href={`mailto:${party.email}`}
                                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Mail size={14} />
                                            {party.email}
                                        </a>
                                    )}
                                    {fullAddress && (
                                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <MapPin size={14} />
                                            {fullAddress}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Edit button */}
                        <div className="flex items-center gap-2 shrink-0">
                            <PartyDialog
                                initialData={party}
                                trigger={
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-border text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-all"
                                    >
                                        <Edit size={14} className="mr-2" />
                                        Edit Party
                                    </Button>
                                }
                            />
                        </div>
                    </div>

                    {/* GSTIN / PAN / Terms row */}
                    {(party.gstin || party.pan || party.paymentTerms || party.creditLimit) && (
                        <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-6">
                            {!!party.gstin && (
                                <div className="flex items-center gap-2">
                                    <Building2 size={14} className="text-primary" />
                                    <span className="text-xs text-muted-foreground">GSTIN</span>
                                    <span className="text-xs font-mono text-primary font-semibold tracking-wider">
                                        {party.gstin}
                                    </span>
                                </div>
                            )}
                            {!!party.pan && (
                                <div className="flex items-center gap-2">
                                    <CreditCard size={14} className="text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">PAN</span>
                                    <span className="text-xs font-mono text-foreground">
                                        {party.pan}
                                    </span>
                                </div>
                            )}
                            {!!party.paymentTerms && (
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Terms</span>
                                    <span className="text-xs text-foreground">
                                        {party.paymentTerms}
                                    </span>
                                </div>
                            )}
                            {!!party.creditLimit && party.creditLimit > 0 && (
                                <div className="flex items-center gap-2">
                                    <CreditCard size={14} className="text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Credit Limit</span>
                                    <span className="text-xs text-foreground">
                                        ₹{party.creditLimit.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
