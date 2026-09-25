import { getDaysInMonth } from "date-fns"

// The per-day rate is never stored — it's always the monthly salary spread across
// however many days the given month actually has (30 in September, 31 in October, ...),
// recomputed wherever it's needed instead of trusted from a saved column. Kept in a
// plain module (no "use server") since it's a synchronous pure function — a file with
// "use server" requires every export to be async, which a helper like this can't be.
export function dailyRateForMonth(monthlySalary: number, monthStart: Date): number {
    return monthlySalary / getDaysInMonth(monthStart)
}
