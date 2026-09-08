import { PrismaClient } from "@prisma/client"

// DATABASE_URL is a direct (non-pooled) connection capped at connection_limit=1 —
// after any idle period (app backgrounded, quiet moment) that single connection can
// go stale, and every subsequent query queues behind it forever since there's no
// other connection to fall back to. Raise the pool so one bad connection can't block
// every button click, and cap how long a query waits for one instead of hanging.
function resilientDatabaseUrl(): string | undefined {
    const url = process.env.DATABASE_URL
    if (!url) return url
    try {
        const parsed = new URL(url)
        const currentLimit = parsed.searchParams.get("connection_limit")
        if (!currentLimit || Number(currentLimit) < 5) {
            parsed.searchParams.set("connection_limit", "5")
        }
        if (!parsed.searchParams.has("pool_timeout")) {
            parsed.searchParams.set("pool_timeout", "10")
        }
        return parsed.toString()
    } catch {
        return url
    }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        datasources: { db: { url: resilientDatabaseUrl() } },
    })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
