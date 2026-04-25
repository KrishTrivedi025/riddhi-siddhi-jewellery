import * as z from "zod"

// ─── Predefined Expense Categories ───────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
    "Rent",
    "Electricity",
    "Labour",
    "Transport",
    "Tools & Equipment",
    "Raw Material",
    "Marketing",
    "Office Supplies",
    "Miscellaneous",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// Category badge colour mapping
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
    "Rent":              "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Electricity":       "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "Labour":            "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Transport":         "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Tools & Equipment": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Raw Material":      "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "Marketing":         "bg-pink-500/10 text-pink-400 border-pink-500/20",
    "Office Supplies":   "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Miscellaneous":     "bg-[#2A2A2A] text-[#A0A0A0] border-[#3A3A3A]",
}

// GST rates applicable on expenses
export const EXPENSE_GST_RATES = [0, 5, 12, 18, 28] as const

// ─── Schema ──────────────────────────────────────────────────────────────────

export const expenseSchema = z.object({
    expenseDate:   z.date({ required_error: "Expense date is required" }),
    category:      z.string().min(1, "Category is required"),
    description:   z.string().optional(),
    amount:        z.coerce.number().positive("Amount must be greater than 0"),
    gstRate:       z.coerce.number().default(0),
    gstAmount:     z.coerce.number().default(0),
    bankAccountId: z.string().optional(),
    receiptUrl:    z.string().optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
