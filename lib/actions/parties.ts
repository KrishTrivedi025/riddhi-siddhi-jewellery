"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { PartyFormValues } from "../schemas/party-schema"

export async function getParties(type?: "CUSTOMER" | "SUPPLIER") {
    try {
        const parties = await prisma.party.findMany({
            where: {
                deletedAt: null,
                ...(type && { partyType: type })
            },
            orderBy: { name: "asc" }
        })
        return parties
    } catch (error) {
        console.error("Error fetching parties:", error)
        throw new Error("Failed to fetch parties")
    }
}

export async function createParty(data: PartyFormValues) {
    try {
        const party = await prisma.party.create({
            data: {
                ...data,
                openingBalance: data.openingBalance || 0,
            }
        })
        revalidatePath("/dashboard/parties")
        return { success: true, data: party }
    } catch (error) {
        console.error("Error creating party:", error)
        return { success: false, error: "Failed to create party" }
    }
}

export async function updateParty(id: string, data: Partial<PartyFormValues>) {
    try {
        const party = await prisma.party.update({
            where: { id },
            data
        })
        revalidatePath("/dashboard/parties")
        return { success: true, data: party }
    } catch (error) {
        console.error("Error updating party:", error)
        return { success: false, error: "Failed to update party" }
    }
}

export async function deleteParty(id: string) {
    try {
        await prisma.party.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
        revalidatePath("/dashboard/parties")
        return { success: true }
    } catch (error) {
        console.error("Error deleting party:", error)
        return { success: false, error: "Failed to delete party" }
    }
}
