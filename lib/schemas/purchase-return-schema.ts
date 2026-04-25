import * as z from "zod"

export const purchaseReturnItemSchema = z.object({
    itemId: z.string().nullable(),
    itemName: z.string().min(1, "Item name is required"),
    hsnCode: z.string().nullable(),
    quantity: z.number().min(0.001, "Quantity must be greater than 0"),
    unit: z.string().default("pcs"),
    unitPrice: z.number().min(0, "Price cannot be negative"),
    discount: z.number().min(0).default(0),
    discountType: z.enum(["percent", "amount"]).default("percent"),
    gstRate: z.number().min(0).default(3),
})

export const purchaseReturnSchema = z.object({
    purchaseInvoiceId: z.string().min(1, "Original purchase invoice is required"),
    debitNoteDate: z.coerce.date(),
    partyId: z.string().min(1, "Supplier is required"),
    reason: z.string().nullable(),
    items: z.array(purchaseReturnItemSchema).min(1, "At least one item is required"),
})

export type PurchaseReturnFormValues = z.infer<typeof purchaseReturnSchema>
export type PurchaseReturnItemFormValues = z.infer<typeof purchaseReturnItemSchema>
