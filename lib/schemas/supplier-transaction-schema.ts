import * as z from "zod"

export const supplierTransactionAttachmentSchema = z.object({
    url: z.string().url(),
    fileName: z.string(),
    fileType: z.enum(["image", "pdf"]),
})

export const supplierTransactionSchema = z.object({
    partyId: z.string().min(1, "Supplier is required"),
    type: z.enum(["GAVE", "GOT"]),
    amount: z.number().positive("Amount must be greater than 0"),
    details: z.string().optional().nullable(),
    date: z.coerce.date(),
    paymentMode: z.enum(["CASH", "ONLINE"]).optional().nullable(),
    attachments: z.array(supplierTransactionAttachmentSchema).max(4, "Maximum 4 attachments").default([]),
})

export type SupplierTransactionFormValues = z.infer<typeof supplierTransactionSchema>
export type SupplierTransactionAttachmentValue = z.infer<typeof supplierTransactionAttachmentSchema>

// dailyDeduction is no longer user input — it's always monthlySalary / days in that
// calendar month (see dailyRateForMonth in lib/actions/workers.ts), recomputed per month.
export const quickSupplierSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        phone: z.string().optional().nullable(),
        isWorker: z.boolean().default(false),
        monthlySalary: z.number().positive("Monthly salary must be greater than 0").optional(),
    })
    .refine((data) => !data.isWorker || data.monthlySalary !== undefined, {
        message: "Monthly salary is required for a worker",
        path: ["monthlySalary"],
    })

export type QuickSupplierFormValues = z.infer<typeof quickSupplierSchema>
