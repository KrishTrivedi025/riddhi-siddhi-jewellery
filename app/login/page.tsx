"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password required"),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: FormData) => {
        setLoading(true)
        setError("")
        const res = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        })
        if (res?.error) {
            setLoading(false)
            setError("Invalid email or password")
        } else {
            // Refresh the router first so the session cookie is available
            // to the middleware before navigating — fixes double-click bug
            router.refresh()
            router.push("/dashboard")
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                        <span className="text-2xl">💎</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground">Riddhi Siddhi Jewellery</h1>
                    <p className="text-muted-foreground mt-2 text-sm">Sign in to your account</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm text-muted-foreground mb-2">Email</label>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="admin@vyapar.com"
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm text-muted-foreground mb-2">Password</label>
                            <input
                                {...register("password")}
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-background font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}