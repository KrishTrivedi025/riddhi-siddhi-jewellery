"use server"

import { auth } from "@/auth"

/**
 * Get the userId from the current session.
 * Throws if not authenticated — always call inside server actions.
 */
export async function requireUserId(): Promise<string> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthenticated")
    }
    return session.user.id
}
