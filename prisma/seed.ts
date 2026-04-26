import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding database...")

    // ── 1. DEMO account (for testing / debugging) ─────────────────────────────
    const demoEmail    = "demo@vyapar.com"
    const demoPassword = bcrypt.hashSync("demo1234", 10)

    const demoUser = await prisma.user.upsert({
        where:  { email: demoEmail },
        update: {},
        create: { email: demoEmail, password: demoPassword },
    })

    // Create demo business profile (linked to demo user)
    await prisma.businessProfile.upsert({
        where:  { userId: demoUser.id },
        update: {},
        create: {
            userId:           demoUser.id,
            businessName:     "Demo Jewellery Store",
            ownerName:        "Demo Owner",
            businessType:     "Jewellery Manufacturer",
            state:            "Maharashtra",
            city:             "Mumbai",
            address:          "Demo Address, Test Lane",
            pincode:          "400001",
            mobile:           "9999999999",
            email:            demoEmail,
            invoicePrefix:    "DEMO",
            invoiceCounter:   1,
            termsConditions:  "Demo account — for testing only.",
            bankName:         "Demo Bank",
            accountName:      "Demo Account",
            accountNumber:    "00000000000",
            ifscCode:         "DEMO0000001",
        },
    })

    console.log("✅ Demo user:", demoEmail, "/ password: demo1234")

    // ── 2. ADMIN account (real production use) ────────────────────────────────
    const adminEmail    = "kailashtrivedi7@gmail.com"
    const adminPassword = bcrypt.hashSync("Kailash@2025", 10)

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

    console.log("✅ Admin user:", adminEmail, "/ password: Kailash@2025")
    console.log("")
    console.log("─────────────────────────────────────────────")
    console.log("  DEMO    → demo@vyapar.com   / demo1234")
    console.log("  ADMIN   → kailashtrivedi7@gmail.com / Kailash@2025")
    console.log("─────────────────────────────────────────────")
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())