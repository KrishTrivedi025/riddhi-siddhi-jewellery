import * as z from "zod"

export const bankAccountSchema = z.object({
    accountName: z.string().min(1, "Account name is required"),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    branchName: z.string().optional(),
    upiId: z.string().optional(),
    openingBalance: z.coerce.number().default(0),
    isCash: z.boolean().default(false),
})

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>

export const transferSchema = z.object({
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountId: z.string().min(1, "Destination account is required"),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    transferDate: z.date({
        required_error: "Transfer date is required",
    }),
    notes: z.string().optional(),
}).refine(data => data.fromAccountId !== data.toAccountId, {
    message: "Source and destination accounts must be different",
    path: ["toAccountId"],
})

export type TransferFormValues = z.infer<typeof transferSchema>
