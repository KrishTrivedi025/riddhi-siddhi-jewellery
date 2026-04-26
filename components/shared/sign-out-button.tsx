"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border
                       text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
            <LogOut size={14} />
            Sign Out
        </button>
    )
}
