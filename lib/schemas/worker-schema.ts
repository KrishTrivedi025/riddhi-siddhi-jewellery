import * as z from "zod"

export const workerRateSchema = z.object({
    monthlySalary: z.number().positive("Monthly salary must be greater than 0"),
    dailyDeduction: z.number().positive("Daily deduction must be greater than 0"),
})

export type WorkerRateFormValues = z.infer<typeof workerRateSchema>
