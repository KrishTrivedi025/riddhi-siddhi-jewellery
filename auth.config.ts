import type { NextAuthConfig } from "next-auth"

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
if (!secret) {
    throw new Error(
        "AUTH_SECRET (or NEXTAUTH_SECRET) is not set. Generate one with `npx auth secret` " +
        "and add it to your .env file — see .env.example."
    )
}

export const authConfig = {
    secret,
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    providers: [],
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