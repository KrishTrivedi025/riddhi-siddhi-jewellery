// Server component — fetches session, passes to client header
import { auth } from "@/auth"
import { signOut } from "@/auth"
import { HeaderClient } from "./header-client"

export default async function Header() {
  const session = await auth()
  const email = session?.user?.email ?? ""

  const handleSignOut = async () => {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return <HeaderClient email={email} signOutAction={handleSignOut} />
}