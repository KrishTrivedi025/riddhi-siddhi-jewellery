import { Suspense } from "react"
import { getBusinessProfile } from "@/lib/actions/sales"
import { redirect } from "next/navigation"
import SettingsForm from "@/components/dashboard/settings-form"
import { signOut } from "@/auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
    return (
        <Suspense fallback={<SettingsSkeleton />}>
            <SettingsData />
        </Suspense>
    )
}

async function SettingsData() {
    const profile = await getBusinessProfile()
    if (!profile) redirect("/setup")

    const handleSignOut = async () => {
        "use server"
        await signOut({ redirectTo: "/login" })
    }

    return <SettingsForm
        key={JSON.stringify(profile)}
        profile={profile as Parameters<typeof SettingsForm>[0]["profile"]}
        signOutAction={handleSignOut}
    />
}

function SettingsSkeleton() {
    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-10 w-24 rounded-xl" />
            </div>

            {/* Profile preview */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>

            {/* Tabs card */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <Skeleton className="h-9 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            {/* Sign out card */}
            <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
    )
}
