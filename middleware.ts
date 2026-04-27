import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { pathname } = req.nextUrl

    // Public routes — never redirect these
    if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/setup") ||
        pathname.startsWith("/api") ||
        pathname === "/"
    ) {
        return NextResponse.next()
    }

    // Only protect /dashboard — if not logged in, send to login
    if (pathname.startsWith("/dashboard") && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }
})

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)"],
}