"use client"

import { signout } from "@lib/data/customer"
import { useParams } from "next/navigation"

import { SignOutIcon } from "./icons"

export default function MuseSignOutAction() {
  const { countryCode } = useParams() as { countryCode: string }

  const handleSignOut = async () => {
    await signout(countryCode)
  }

  return (
    <div className="muse-signout-lowkey">
      <button type="button" onClick={handleSignOut}>
        <SignOutIcon />
        <span>Sign out</span>
      </button>
    </div>
  )
}
