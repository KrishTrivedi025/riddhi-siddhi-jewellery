"use server"

import { prisma } from "@/lib/db"
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
    termsConditions?: string
}

export async function createBusinessSetup(data: SetupFormData) {
    try {
        // Check if profile already exists
        const existing = await prisma.businessProfile.findFirst()
        if (existing) return { success: false, error: "Business profile already exists" }

        await prisma.$transaction(async (tx) => {
            // Create business profile with bank details
            await tx.businessProfile.create({
                data: {
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
                    // New bank fields
                    bankName: data.bankName,
                    accountName: data.accountName,
                    accountNumber: data.accountNumber,
                    ifscCode: data.ifscCode,
                    branchName: data.branchName || null,
                },
            })

            // Also create a default Cash account for liquidity tracking (this is separate from invoice details)
            const cashExists = await tx.bankAccount.findFirst({ where: { isCash: true } })
            if (!cashExists) {
                await tx.bankAccount.create({
                    data: {
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
        console.log("Updating business profile for ID:", data.id)
        
        const updateData: any = {
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
            termsConditions: data.termsConditions || null,
            // Explicitly map bank fields
            bankName: data.bankName || null,
            accountName: data.accountName || null,
            accountNumber: data.accountNumber || null,
            ifscCode: data.ifscCode || null,
            branchName: data.branchName || null,
        }

        // Only update URLs if they are provided as non-empty strings, 
        // or set to null if explicitly cleared (depending on how the form sends them)
        if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null
        if (data.signatureUrl !== undefined) updateData.signatureUrl = data.signatureUrl || null

        await prisma.businessProfile.update({
            where: { id: data.id },
            data: updateData,
        })

        console.log("Profile updated successfully")
        revalidatePath("/dashboard")
        revalidatePath("/dashboard/settings")
        revalidatePath("/dashboard/sales")
        return { success: true }
    } catch (err) {
        console.error("Update profile error details:", err)
        return { success: false, error: err instanceof Error ? err.message : "Update failed" }
    }
}

export async function checkProfileExists(): Promise<boolean> {
    try {
        const profile = await prisma.businessProfile.findFirst({ select: { id: true } })
        return !!profile
    } catch {
        return false
    }
}
