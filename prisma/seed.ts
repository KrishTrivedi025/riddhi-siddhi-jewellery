import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "admin@vyapar.com"
  const password = bcrypt.hashSync("admin123", 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password },
  })

  const business = await prisma.businessProfile.upsert({
      where: { id: "default-profile" }, // Any fixed ID for seed
      update: {},
      create: {
          id: "default-profile",
          businessName: "Riddhi Siddhi Jewellery",
          ownerName: "Admin",
          gstin: "27ABYPT3471B1Z7", // Placeholder or from your screen
          state: "Maharashtra",
          city: "Mumbai",
          address: "Daftari Road, Malad East",
          pincode: "400097",
          mobile: "+91 99999 99999",
          email: "admin@vyapar.com",
          invoicePrefix: "INV",
          invoiceCounter: 1,
          termsConditions: "1. Goods once sold will not be taken back.\n2. Interest @ 18% will be charged if payment is not made within 45 days.",
      }
  })

  console.log("Seeded User:", user.email)
  console.log("Seeded Business:", business.businessName)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())