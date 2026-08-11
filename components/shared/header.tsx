// Server component — receives the session (already resolved once in the
// dashboard layout) instead of calling auth() again on every navigation.
import { signOut } from "@/auth"
import { HeaderClient } from "./header-client"

export default function Header({ email }: { email: string }) {
  const handleSignOut = async () => {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return <HeaderClient email={email} signOutAction={handleSignOut} />
}