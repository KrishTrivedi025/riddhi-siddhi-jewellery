"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export interface SetupFormData {
    // Step 1 - Business Identity
    businessName: string
    ownerName: string
    businessType: string
    logoUrl?: string

    // Step 2 - Tax & Legal
    gstin?: string
    pan?: string
    state: string

    // Step 3 - Contact & Address
    address: string
    city: string
    pincode: string
    mobile: string
    email?: string

    // Step 4 - Bank & Invoice
    bankName: string
    accountName: string
    accountNumber: string
    ifscCode: string
    branchName?: string
    signatureUrl?: string
    invoicePrefix: string
    noGstInvoicePrefix?: string
    termsConditions?: string
}

/** Get the current logged-in userId — throws if unauthenticated */
async function requireUserId(): Promise<string> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthenticated")
    return session.user.id
}

export async function createBusinessSetup(data: SetupFormData) {
    try {
        const userId = await requireUserId()

        // Check if THIS user already has a profile
        const existing = await prisma.businessProfile.findUnique({ where: { userId } })
        if (existing) return { success: false, error: "Business profile already exists" }

        await prisma.$transaction(async (tx) => {
            await tx.businessProfile.create({
                data: {
                    userId,                                      // ← scoped to user
                    businessName: data.businessName,
                    ownerName: data.ownerName,
                    businessType: data.businessType,
                    gstin: data.gstin || null,
                    pan: data.pan || null,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                    mobile: data.mobile,
                    email: data.email || null,
                    logoUrl: data.logoUrl || null,
                    signatureUrl: data.signatureUrl || null,
                    invoicePrefix: data.invoicePrefix || "INV",
                    invoiceCounter: 1,
                    termsConditions: data.termsConditions || null,
                    bankName: data.bankName,
                    accountName: data.accountName,
                    accountNumber: data.accountNumber,
                    ifscCode: data.ifscCode,
                    branchName: data.branchName || null,
                },
            })

            const cashExists = await tx.bankAccount.findFirst({ where: { userId, isCash: true } })
            if (!cashExists) {
                await tx.bankAccount.create({
                    data: {
                        userId,
                        accountName: "Cash",
                        isCash: true,
                        isDefault: false,
                        openingBalance: 0,
                        currentBalance: 0,
                    },
                })
            }
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (err) {
        console.error("Setup error:", err)
        return { success: false, error: err instanceof Error ? err.message : "Setup failed" }
    }
}

export async function updateBusinessProfile(data: Partial<SetupFormData> & { id: string }) {
    try {
        const userId = await requireUserId()

        // Security: verify the profile belongs to the logged-in user
        const profile = await prisma.businessProfile.findUnique({ where: { id: data.id } })
        if (!profile || profile.userId !== userId) {
            return { success: false, error: "Not authorised" }
        }

        const updateData: Record<string, unknown> = {
            businessName: data.businessName,
            ownerName: data.ownerName,
            businessType: data.businessType,
            gstin: data.gstin || null,
            pan: data.pan || null,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            mobile: data.mobile,
            email: data.email || null,
            invoicePrefix: data.invoicePrefix,
            noGstInvoicePrefix: data.noGstInvoicePrefix || "BILL",
            termsConditions: data.termsConditions || null,
            bankName: data.bankName || null,
            accountName: data.accountName || null,
            accountNumber: data.accountNumber || null,
            ifscCode: data.ifscCode || null,
            branchName: data.branchName || null,
        }

        if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null
        if (data.signatureUrl !== undefined) updateData.signatureUrl = data.signatureUrl || null

        await prisma.businessProfile.update({
            where: { id: data.id },
            data: updateData,
        })

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/settings")
        revalidatePath("/dashboard/sales")
        return { success: true }
    } catch (err) {
        console.error("Update profile error:", err)
        return { success: false, error: err instanceof Error ? err.message : "Update failed" }
    }
}

/** Returns true if the currently logged-in user has a business profile */
export async function checkProfileExists(): Promise<boolean> {
    try {
        const session = await auth()
        if (!session?.user?.id) return false
        const profile = await prisma.businessProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        })
        return !!profile
    } catch {
        return false
    }
}

/** Get the business profile for the currently logged-in user */
export async function getBusinessProfile() {
    try {
        const userId = await requireUserId()
        return await prisma.businessProfile.findUnique({ where: { userId } })
    } catch {
        return null
    }
}
