import * as z from "zod"

export const partySchema = z.object({
    partyType: z.enum(["CUSTOMER", "SUPPLIER"]),
    name: z.string().min(2, "Name must be at least 2 characters"),
    contactPerson: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    gstin: z.string().optional().nullable(),
    pan: z.string().optional().nullable(),
    billingAddress: z.string().optional().nullable(),
    shippingAddress: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    openingBalance: z.number().default(0),
    balanceType: z.enum(["debit", "credit"]).default("debit"),
    creditLimit: z.number().optional().nullable(),
    paymentTerms: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    priceMultiplier: z.number().min(0.01, "Must be greater than 0").max(10, "Must be 10 or less").default(1),
})

export type PartyFormValues = z.infer<typeof partySchema>
