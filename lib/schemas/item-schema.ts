import * as z from "zod"

export const itemPriceComponentSchema = z.object({
    label: z.string().min(1, "Label is required"),
    amount: z.number().min(0).default(0),
})

export type ItemPriceComponentFormValues = z.infer<typeof itemPriceComponentSchema>

export const itemSchema = z.object({
    itemCode: z.string().min(1, "Item code is required"),
    description: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    unit: z.enum(["gm", "pcs", "set", "kg"]).default("pcs"),
    hsnCode: z.string().optional().nullable(),
    gstRate: z.number().default(3),
    purchasePrice: z.number().min(0).default(0),
    salePrice: z.number().min(0).default(0),
    weight: z.number().min(0).optional().nullable(),
    openingStock: z.number().min(0).default(0),
    currentStock: z.number().min(0).default(0),
    lowStockAlert: z.number().min(0).default(0),
    imageUrl: z.string().optional().nullable(),
    priceComponents: z.array(itemPriceComponentSchema).optional().default([]),
})

export type ItemFormValues = z.infer<typeof itemSchema>

export const categorySchema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
