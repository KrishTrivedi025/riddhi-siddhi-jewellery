/**
 * cleanup-db.ts
 * One-time script to:
 *   1. Delete demo user (demo@vyapar.com) and ALL its cascaded data
 *   2. Delete ALL mock/test data from admin account (kailashtrivedi7@gmail.com)
 *   3. Update admin password to Kailash.1970
 *
 * Run: npx tsx prisma/cleanup-db.ts
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🧹 Starting database cleanup...\n")

    // ── 1. Delete Demo Account ─────────────────────────────────────────────
    const demoUser = await prisma.user.findUnique({ where: { email: "demo@vyapar.com" } })
    if (demoUser) {
        // onDelete: Cascade handles BusinessProfile, Party, BankAccount,
        // ItemCategory, Item, SaleInvoice, PurchaseInvoice, Expense,
        // Payment, SaleReturn, PurchaseReturn, AccountTransfer
        await prisma.user.delete({ where: { id: demoUser.id } })
        console.log("✅ Demo user (demo@vyapar.com) and ALL related data deleted")
    } else {
        console.log("ℹ️  Demo user not found — already deleted")
    }

    // ── 2. Purge ALL data from Admin Account ───────────────────────────────
    const adminUser = await prisma.user.findUnique({ where: { email: "kailashtrivedi7@gmail.com" } })
    if (!adminUser) {
        console.log("⚠️  Admin user not found — skipping data purge")
        return
    }

    const uid = adminUser.id
    console.log(`\n🗑️  Purging all data for admin (${uid})...`)

    // Delete in dependency order (children first)

    // StockMovements — linked to Items (no userId, must go through items)
    const adminItems = await prisma.item.findMany({ where: { userId: uid }, select: { id: true } })
    const adminItemIds = adminItems.map(i => i.id)
    if (adminItemIds.length > 0) {
        const smDel = await prisma.stockMovement.deleteMany({ where: { itemId: { in: adminItemIds } } })
        console.log(`  → StockMovements deleted: ${smDel.count}`)
    }

    // SaleReturnItems → SaleReturns
    const saleReturns = await prisma.saleReturn.findMany({ where: { userId: uid }, select: { id: true } })
    if (saleReturns.length > 0) {
        const srItemDel = await prisma.saleReturnItem.deleteMany({ where: { saleReturnId: { in: saleReturns.map(r => r.id) } } })
        console.log(`  → SaleReturnItems deleted: ${srItemDel.count}`)
        const srDel = await prisma.saleReturn.deleteMany({ where: { userId: uid } })
        console.log(`  → SaleReturns deleted: ${srDel.count}`)
    }

    // PurchaseReturnItems → PurchaseReturns
    const purchaseReturns = await prisma.purchaseReturn.findMany({ where: { userId: uid }, select: { id: true } })
    if (purchaseReturns.length > 0) {
        const prItemDel = await prisma.purchaseReturnItem.deleteMany({ where: { purchaseReturnId: { in: purchaseReturns.map(r => r.id) } } })
        console.log(`  → PurchaseReturnItems deleted: ${prItemDel.count}`)
        const prDel = await prisma.purchaseReturn.deleteMany({ where: { userId: uid } })
        console.log(`  → PurchaseReturns deleted: ${prDel.count}`)
    }

    // PaymentModes → Payments
    const payments = await prisma.payment.findMany({ where: { userId: uid }, select: { id: true } })
    if (payments.length > 0) {
        const pmDel = await prisma.paymentMode.deleteMany({ where: { paymentId: { in: payments.map(p => p.id) } } })
        console.log(`  → PaymentModes deleted: ${pmDel.count}`)
        const payDel = await prisma.payment.deleteMany({ where: { userId: uid } })
        console.log(`  → Payments deleted: ${payDel.count}`)
    }

    // SaleInvoiceItems → SaleInvoices
    const saleInvoices = await prisma.saleInvoice.findMany({ where: { userId: uid }, select: { id: true } })
    if (saleInvoices.length > 0) {
        const siItemDel = await prisma.saleInvoiceItem.deleteMany({ where: { invoiceId: { in: saleInvoices.map(i => i.id) } } })
        console.log(`  → SaleInvoiceItems deleted: ${siItemDel.count}`)
        const siDel = await prisma.saleInvoice.deleteMany({ where: { userId: uid } })
        console.log(`  → SaleInvoices deleted: ${siDel.count}`)
    }

    // PurchaseInvoiceItems → PurchaseInvoices
    const purchaseInvoices = await prisma.purchaseInvoice.findMany({ where: { userId: uid }, select: { id: true } })
    if (purchaseInvoices.length > 0) {
        const piItemDel = await prisma.purchaseInvoiceItem.deleteMany({ where: { invoiceId: { in: purchaseInvoices.map(i => i.id) } } })
        console.log(`  → PurchaseInvoiceItems deleted: ${piItemDel.count}`)
        const piDel = await prisma.purchaseInvoice.deleteMany({ where: { userId: uid } })
        console.log(`  → PurchaseInvoices deleted: ${piDel.count}`)
    }

    // Expenses
    const expDel = await prisma.expense.deleteMany({ where: { userId: uid } })
    console.log(`  → Expenses deleted: ${expDel.count}`)

    // AccountTransfers
    const trDel = await prisma.accountTransfer.deleteMany({ where: { userId: uid } })
    console.log(`  → AccountTransfers deleted: ${trDel.count}`)

    // Items
    const itemDel = await prisma.item.deleteMany({ where: { userId: uid } })
    console.log(`  → Items deleted: ${itemDel.count}`)

    // ItemCategories
    const catDel = await prisma.itemCategory.deleteMany({ where: { userId: uid } })
    console.log(`  → ItemCategories deleted: ${catDel.count}`)

    // Parties
    const partyDel = await prisma.party.deleteMany({ where: { userId: uid } })
    console.log(`  → Parties deleted: ${partyDel.count}`)

    // BankAccounts
    const bankDel = await prisma.bankAccount.deleteMany({ where: { userId: uid } })
    console.log(`  → BankAccounts deleted: ${bankDel.count}`)

    // Reset business profile counters
    await prisma.businessProfile.updateMany({
        where: { userId: uid },
        data: { invoiceCounter: 1, creditNoteCounter: 1 },
    })
    console.log(`  → BusinessProfile counters reset to 1`)

    // ── 3. Update Admin Password ───────────────────────────────────────────
    const newHash = bcrypt.hashSync("Kailash.1970", 10)
    await prisma.user.update({ where: { id: uid }, data: { password: newHash } })
    console.log(`\n✅ Admin password updated to: Kailash.1970`)

    console.log("\n═══════════════════════════════════════════")
    console.log("  CLEANUP COMPLETE — admin account is fresh")
    console.log("  Login: kailashtrivedi7@gmail.com / Kailash.1970")
    console.log("═══════════════════════════════════════════")
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
