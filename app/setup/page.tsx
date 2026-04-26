import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { checkProfileExists } from "@/lib/actions/setup"
import BusinessSetupWizard from "@/components/setup/business-setup-wizard"
import { SignOutButton } from "@/components/shared/sign-out-button"

export default async function SetupPage() {
    const session = await auth()
    if (!session) redirect("/login")

    const hasProfile = await checkProfileExists()
    if (hasProfile) redirect("/dashboard")

    return (
        <div className="relative">
            {/* Escape hatch — if stuck in setup loop, user can sign out */}
            <div className="absolute top-4 right-4 z-50">
                <SignOutButton />
            </div>
            <BusinessSetupWizard />
        </div>
    )
}
