import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    providers: [], // Providers are added in auth.ts
    callbacks: {
        jwt({ token, user }) {
            if (user) token.id = user.id
            return token
        },
        session({ session, token }) {
            session.user.id = token.id as string
            return session
        },
    },
} satisfies NextAuthConfig
