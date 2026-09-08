import * as z from "zod"

export const paymentModeSchema = z.object({
    mode: z.string().min(1, "Mode is required"),
    amount: z.number().min(0.01, "Amount must be greater than zero"),
    reference: z.string().optional(),
    bankAccountId: z.string().optional(),
})

export const paymentInSchema = z.object({
    partyId: z.string().min(1, "Customer must be selected"),
    isGst: z.boolean(),
    paymentDate: z.coerce.date(),
    totalAmount: z.number().min(0.01, "Payment amount must be greater than zero"),
    modes: z.array(paymentModeSchema).min(1, "At least one payment mode is required"),
    notes: z.string().optional(),
})

export type PaymentInFormValues = z.infer<typeof paymentInSchema>
