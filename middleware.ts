import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const pathname = req.nextUrl.pathname
    const isAuthPage = pathname.startsWith("/login")
    const isSetupPage = pathname.startsWith("/setup")

    // Don't redirect on setup page — let layout handle it
    if (isSetupPage) return

    if (!isLoggedIn && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)"],
}