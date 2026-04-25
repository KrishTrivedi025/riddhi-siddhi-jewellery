import * as z from "zod"

// ─── Purchase Invoice Line Item Schema ───────────────────────────────────────

export const purchaseInvoiceItemSchema = z.object({
    itemId: z.string().optional().nullable(),
    itemName: z.string().min(1, "Item name is required"),
    hsnCode: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    quantity: z.number().min(0.001, "Quantity must be greater than 0"),
    unit: z.string().default("pcs"),
    unitPrice: z.number().min(0, "Price must be ≥ 0"),
    discount: z.number().min(0).default(0),
    discountType: z.enum(["percent", "amount"]).default("percent"),
    gstRate: z.number().default(3),
    // Jewellery-specific fields
    purity: z.string().optional().nullable(),
    netWeight: z.number().optional().nullable(),
    grossWeight: z.number().optional().nullable(),
    makingCharges: z.number().min(0).default(0),
    wastagePercent: z.number().min(0).default(0),
    hallmarkNumber: z.string().optional().nullable(),
    stoneDetails: z.string().optional().nullable(),
})

export type PurchaseInvoiceItemFormValues = z.infer<typeof purchaseInvoiceItemSchema>

// ─── Purchase Invoice Schema ─────────────────────────────────────────────────

export const purchaseInvoiceSchema = z.object({
    vendorInvoiceNumber: z.string().optional().nullable(),
    invoiceDate: z.coerce.date(),
    dueDate: z.coerce.date().optional().nullable(),
    partyId: z.string().min(1, "Supplier is required"),
    placeOfSupply: z.string().min(1, "Place of supply is required"),
    items: z.array(purchaseInvoiceItemSchema).min(1, "At least one item is required"),
    notes: z.string().optional().nullable(),
    // Payment
    paymentMode: z.enum(["cash", "bank", "upi", "cheque", "none"]).default("none"),
    amountPaid: z.number().min(0).default(0),
})

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>
