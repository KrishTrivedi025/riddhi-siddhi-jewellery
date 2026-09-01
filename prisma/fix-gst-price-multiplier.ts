/**
 * fix-gst-price-multiplier.ts
 * One-time correction: GST invoices should show product prices multiplied by a
 * flat 2x for every party (not the party's own Without-GST priceMultiplier code).
 * Recomputes every active isGst=true SaleInvoice's items/totals from their
 * current (real) unitPrice x GST_PRICE_MULTIPLIER, using the same GST math as
 * createSaleInvoice.
 *
 * Run: npx tsx prisma/fix-gst-price-multiplier.ts
 */
import { PrismaClient } from "@prisma/client"
import { calculateLineItemGST, GST_PRICE_MULTIPLIER } from "../lib/gst-utils"
import { isInterState } from "../lib/indian-states"

const prisma = new PrismaClient()

function round2(n: number) {
    return Math.round(n * 100) / 100
}

async function main() {
    const businessProfiles = await prisma.businessProfile.findMany()
    const profileByUser = new Map(businessProfiles.map((p) => [p.userId, p]))

    const invoices = await prisma.saleInvoice.findMany({
        where: { deletedAt: null, status: "active", isGst: true },
        include: { items: true, party: true },
    })

    if (invoices.length === 0) {
        console.log("No active GST invoices found. Nothing to do.")
        return
    }

    let touched = 0

    for (const invoice of invoices) {
        const profile = profileByUser.get(invoice.userId)
        if (!profile) {
            console.log(`⚠️  No business profile for user ${invoice.userId} (invoice ${invoice.invoiceNumber}) — skipping`)
            continue
        }

        const interState = isInterState(profile.state || "", invoice.placeOfSupply || "")

        let subtotal = 0
        let totalDiscount = 0
        let taxableAmount = 0
        let totalCgst = 0
        let totalSgst = 0
        let totalIgst = 0

        const itemUpdates = invoice.items.map((item) => {
            const correctedUnitPrice = round2(item.unitPrice * GST_PRICE_MULTIPLIER)
            const gst = calculateLineItemGST(
                correctedUnitPrice,
                item.quantity,
                item.discount,
                item.discountType as "percent" | "amount",
                item.gstRate,
                interState,
                item.makingCharges || 0
            )

            const baseAmount = correctedUnitPrice * item.quantity + (item.makingCharges || 0)
            subtotal += baseAmount
            const discountAmt = item.discountType === "percent" ? (baseAmount * item.discount) / 100 : item.discount
            totalDiscount += discountAmt
            taxableAmount += gst.taxableAmount
            totalCgst += gst.cgst
            totalSgst += gst.sgst
            totalIgst += gst.igst

            return {
                id: item.id,
                unitPrice: correctedUnitPrice,
                cgst: gst.cgst,
                sgst: gst.sgst,
                igst: gst.igst,
                amount: gst.totalAmount,
            }
        })

        const totalBeforeRound = taxableAmount + totalCgst + totalSgst + totalIgst
        const roundOff = Math.round(totalBeforeRound * 100) / 100
        const grandTotal = Math.round(totalBeforeRound)
        const actualRoundOff = grandTotal - roundOff

        const amountPaid = invoice.amountPaid
        const balanceDue = grandTotal - amountPaid
        let paymentStatus = "unpaid"
        if (amountPaid >= grandTotal) paymentStatus = "paid"
        else if (amountPaid > 0) paymentStatus = "partial"

        console.log(
            `${invoice.invoiceNumber} (${invoice.party.name}): grandTotal ₹${invoice.grandTotal} → ₹${grandTotal}`
        )

        await prisma.$transaction([
            ...itemUpdates.map((u) =>
                prisma.saleInvoiceItem.update({
                    where: { id: u.id },
                    data: { unitPrice: u.unitPrice, cgst: u.cgst, sgst: u.sgst, igst: u.igst, amount: u.amount },
                })
            ),
            prisma.saleInvoice.update({
                where: { id: invoice.id },
                data: {
                    subtotal: round2(subtotal),
                    totalDiscount: round2(totalDiscount),
                    taxableAmount: round2(taxableAmount),
                    cgst: round2(totalCgst),
                    sgst: round2(totalSgst),
                    igst: round2(totalIgst),
                    roundOff: round2(actualRoundOff),
                    grandTotal,
                    balanceDue,
                    paymentStatus,
                },
            }),
        ])

        touched++
    }

    console.log(`\n✅ Corrected ${touched} GST invoice(s).`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
