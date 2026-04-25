import { getBusinessProfile } from "@/lib/actions/sales"
import { redirect } from "next/navigation"
import SettingsForm from "@/components/dashboard/settings-form"
import { signOut } from "@/auth"

export default async function SettingsPage() {
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
