import * as z from "zod"

export const paymentAllocationSchema = z.object({
    invoiceId: z.string().min(1, "Invoice must be selected"),
    amountApplied: z.number().min(0.01, "Amount must be greater than zero"),
})

export const paymentModeSchema = z.object({
    mode: z.string().min(1, "Mode is required"),
    amount: z.number().min(0.01, "Amount must be greater than zero"),
    reference: z.string().optional(),
    bankAccountId: z.string().optional(),
})

export const paymentOutSchema = z.object({
    partyId: z.string().min(1, "Supplier must be selected"),
    paymentDate: z.coerce.date(),
    totalAmount: z.number().min(0.01, "Payment amount must be greater than zero"),
    modes: z.array(paymentModeSchema).min(1, "At least one payment mode is required"),
    allocations: z.array(paymentAllocationSchema).min(1, "You must select at least one invoice to pay"),
    notes: z.string().optional(),
})

export type PaymentOutFormValues = z.infer<typeof paymentOutSchema>
export type OutPaymentAllocationValues = z.infer<typeof paymentAllocationSchema>
