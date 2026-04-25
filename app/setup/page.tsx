import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { checkProfileExists } from "@/lib/actions/setup"
import BusinessSetupWizard from "@/components/setup/business-setup-wizard"

export default async function SetupPage() {
    const session = await auth()
    if (!session) redirect("/login")

    // If profile already exists, send them to dashboard
    const hasProfile = await checkProfileExists()
    if (hasProfile) redirect("/dashboard")

    return <BusinessSetupWizard />
}
