import { getDaysInMonth } from "date-fns"

// The per-day rate is never stored — it's always the monthly salary spread across
// however many days the given month actually has (30 in September, 31 in October, ...),
// recomputed wherever it's needed instead of trusted from a saved column. Kept in a
// plain module (no "use server") since it's a synchronous pure function — a file with
// "use server" requires every export to be async, which a helper like this can't be.
//
// Rounded to the nearest whole rupee (half up) — a jewellery shop's salary figures don't
// show paise, and 14000/30 = 466.666... looks broken on screen. Every downstream sum
// (accrual totals, carry-forward) is built from this already-rounded value, so it stays
// a whole number too without needing to round again at each step.
export function dailyRateForMonth(monthlySalary: number, monthStart: Date): number {
    return Math.round(monthlySalary / getDaysInMonth(monthStart))
}

// Half of a (already-rounded) daily rate, itself rounded to the nearest whole rupee —
// 467 / 2 = 233.5 would otherwise show as a fraction again.
export function halfDayAmount(dailyDeduction: number): number {
    return Math.round(dailyDeduction / 2)
}
