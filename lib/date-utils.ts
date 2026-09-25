const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

// "Now" resolved via a fixed IST offset rather than trusting the running process's
// own timezone. Vercel's serverless functions run in UTC, while this app's users
// are all in Asia/Kolkata — plain `startOfMonth(new Date())` computed separately on
// the client (browser, IST) and the server (UTC) disagree by a constant 5.5 hours,
// which is enough to pick the wrong calendar month for a worker's ledger/rate on
// almost every request. Resolving "the current month" here, once, server-side only,
// removes that mismatch at the source.
export function currentMonthStart(): Date {
    const istNow = new Date(Date.now() + IST_OFFSET_MS)
    return new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1))
}

// Normalizes an already-resolved Date to the UTC-midnight start of its own month.
// Safe to call on a Date that already anchors a specific month (e.g. one derived
// from currentMonthStart() and then offset via addMonths/subMonths) — it only reads
// UTC calendar fields, so it never re-derives "now" and can't reintroduce the
// client/server mismatch above.
export function monthStartUTC(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

export function monthEndUTC(monthStart: Date): Date {
    return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0, 23, 59, 59, 999))
}

// Same IST-anchored resolution as currentMonthStart(), but for "today" (UTC midnight
// of today's IST calendar date) — used to know which days in a month have "elapsed"
// for daily salary accrual.
export function todayIST(): Date {
    const istNow = new Date(Date.now() + IST_OFFSET_MS)
    return new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()))
}

// A plain, timezone-proof "which calendar month" — the fix for a bug class this file's
// own comments already warned about and got hit by anyway: a client component that
// tracks "the viewed month" as a Date (via date-fns's *local* startOfMonth/addMonths/
// subMonths, correct for on-screen display) and then hands that same Date to a server
// action is not safe. On an IST client those local-midnight instants land on the
// *previous* UTC calendar day, so reading them back with the UTC getters this file's
// other helpers use silently resolves to the wrong month. A MonthKey carries no
// timezone at all — build one from a client Date with its LOCAL getters
// (date.getFullYear()/getMonth(), matching what's on screen), pass the two plain
// numbers across the server action boundary, and reconstruct the UTC month-start from
// them directly with monthKeyToUTC — never by re-reading a Date's own UTC fields.
export interface MonthKey {
    year: number
    month: number // 0-indexed, matching Date.getMonth()/Date.UTC()
}

export function monthKeyToUTC({ year, month }: MonthKey): Date {
    return new Date(Date.UTC(year, month, 1))
}
