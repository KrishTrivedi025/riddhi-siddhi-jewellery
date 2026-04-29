import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding database...")

    // ── ADMIN account (real production use) ────────────────────────────────
    const adminEmail    = "kailashtrivedi7@gmail.com"
    const adminPassword = bcrypt.hashSync("Kailash.1970", 10)

    const adminUser = await prisma.user.upsert({
        where:  { email: adminEmail },
        update: { password: adminPassword },   // Update password in case it changed
        create: { email: adminEmail, password: adminPassword },
    })

    // Create admin business profile (linked to admin user) — no pre-filled data
    // Admin will fill this in via the /setup page on first login
    const existingAdminProfile = await prisma.businessProfile.findUnique({
        where: { userId: adminUser.id },
    })
    if (!existingAdminProfile) {
        await prisma.businessProfile.create({
            data: {
                userId:        adminUser.id,
                businessName:  "Riddhi Siddhi Jewellery",
                ownerName:     "Kailash Trivedi",
                businessType:  "Jewellery Manufacturer",
                state:         "Gujarat",
                city:          "",
                address:       "",
                pincode:       "",
                mobile:        "",
                email:         adminEmail,
                invoicePrefix: "INV",
                invoiceCounter: 1,
                bankName:      "",
                accountName:   "",
                accountNumber: "",
                ifscCode:      "",
            },
        })
        console.log("✅ Admin profile created — please fill settings at /dashboard/settings")
    } else {
        console.log("✅ Admin profile already exists — skipped")
    }

    console.log("✅ Admin user:", adminEmail, "/ password: Kailash.1970")
    console.log("")
    console.log("─────────────────────────────────────────────")
    console.log("  ADMIN   → kailashtrivedi7@gmail.com / Kailash.1970")
    console.log("─────────────────────────────────────────────")
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())