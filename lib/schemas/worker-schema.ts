import * as z from "zod"

// dailyDeduction is no longer user input — it's always monthlySalary / days in that
// calendar month (see dailyRateForMonth in lib/actions/workers.ts), recomputed per month.
export const workerRateSchema = z.object({
    monthlySalary: z.number().positive("Monthly salary must be greater than 0"),
})

export type WorkerRateFormValues = z.infer<typeof workerRateSchema>
