import * as z from "zod"

// ─── Sale Return (Credit Note) Item Schema ───────────────────────────────────

export const saleReturnItemSchema = z.object({
    itemId: z.string().optional().nullable(),
    itemName: z.string().min(1, "Item name is required"),
    hsnCode: z.string().optional().nullable(),
    quantity: z.number().min(0.001, "Return quantity must be > 0"),
    maxQuantity: z.number().optional(), // max returnable qty (from original invoice)
    unit: z.string().default("pcs"),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
    discountType: z.enum(["percent", "amount"]).default("percent"),
    gstRate: z.number().default(3),
})

export type SaleReturnItemFormValues = z.infer<typeof saleReturnItemSchema>

// ─── Sale Return (Credit Note) Schema ────────────────────────────────────────

export const saleReturnSchema = z.object({
    creditNoteDate: z.coerce.date(),
    saleInvoiceId: z.string().min(1, "Original invoice is required"),
    reason: z.string().optional().nullable(),
    items: z.array(saleReturnItemSchema).min(1, "At least one return item is required"),
})

export type SaleReturnFormValues = z.infer<typeof saleReturnSchema>
