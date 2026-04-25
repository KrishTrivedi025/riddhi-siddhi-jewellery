// ─── GST Calculation Engine ──────────────────────────────────────────────────

export interface LineItemGST {
    taxableAmount: number
    cgst: number
    sgst: number
    igst: number
    totalAmount: number
}

export interface InvoiceTotals {
    subtotal: number
    totalDiscount: number
    taxableAmount: number
    cgst: number
    sgst: number
    igst: number
    roundOff: number
    grandTotal: number
}

/**
 * Calculate GST for a single line item
 */
export function calculateLineItemGST(
    unitPrice: number,
    quantity: number,
    discount: number,
    discountType: "percent" | "amount",
    gstRate: number,
    isInterState: boolean,
    makingCharges: number = 0
): LineItemGST {
    const baseAmount = unitPrice * quantity + makingCharges
    
    let discountAmount = 0
    if (discountType === "percent") {
        discountAmount = (baseAmount * discount) / 100
    } else {
        discountAmount = discount
    }

    const taxableAmount = Math.max(0, baseAmount - discountAmount)
    const gstAmount = (taxableAmount * gstRate) / 100

    let cgst = 0
    let sgst = 0
    let igst = 0

    if (isInterState) {
        igst = gstAmount
    } else {
        cgst = gstAmount / 2
        sgst = gstAmount / 2
    }

    const totalAmount = taxableAmount + gstAmount

    return {
        taxableAmount: round2(taxableAmount),
        cgst: round2(cgst),
        sgst: round2(sgst),
        igst: round2(igst),
        totalAmount: round2(totalAmount),
    }
}

/**
 * Calculate invoice-level totals from line items
 */
export function calculateInvoiceTotals(
    lineItems: Array<{
        unitPrice: number
        quantity: number
        discount: number
        discountType: "percent" | "amount"
        gstRate: number
        makingCharges?: number
    }>,
    isInterState: boolean
): InvoiceTotals {
    let subtotal = 0
    let totalDiscount = 0
    let taxableAmount = 0
    let cgst = 0
    let sgst = 0
    let igst = 0

    for (const item of lineItems) {
        const baseAmount = item.unitPrice * item.quantity + (item.makingCharges || 0)
        subtotal += baseAmount

        let discountAmount = 0
        if (item.discountType === "percent") {
            discountAmount = (baseAmount * item.discount) / 100
        } else {
            discountAmount = item.discount
        }
        totalDiscount += discountAmount

        const itemTaxable = Math.max(0, baseAmount - discountAmount)
        taxableAmount += itemTaxable

        const gstAmount = (itemTaxable * item.gstRate) / 100
        if (isInterState) {
            igst += gstAmount
        } else {
            cgst += gstAmount / 2
            sgst += gstAmount / 2
        }
    }

    const totalBeforeRound = taxableAmount + cgst + sgst + igst
    const roundOff = Math.round(totalBeforeRound) - totalBeforeRound
    const grandTotal = Math.round(totalBeforeRound)

    return {
        subtotal: round2(subtotal),
        totalDiscount: round2(totalDiscount),
        taxableAmount: round2(taxableAmount),
        cgst: round2(cgst),
        sgst: round2(sgst),
        igst: round2(igst),
        roundOff: round2(roundOff),
        grandTotal,
    }
}

/**
 * Calculate discount amount from either percent or fixed amount
 */
export function calculateDiscountAmount(
    baseAmount: number,
    discount: number,
    discountType: "percent" | "amount"
): number {
    if (discountType === "percent") {
        return round2((baseAmount * discount) / 100)
    }
    return round2(Math.min(discount, baseAmount))
}

/**
 * Format amount as Indian currency string
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Format number in Indian number system (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num)
}

/** Round to 2 decimal places */
function round2(n: number): number {
    return Math.round(n * 100) / 100
}
