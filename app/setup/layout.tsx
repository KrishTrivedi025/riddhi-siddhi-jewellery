import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Business Setup — Riddhi Siddhi Jewellery",
    description: "Set up your business profile to get started",
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    )
}
