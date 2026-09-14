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
