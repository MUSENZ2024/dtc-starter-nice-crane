import { Metadata } from "next"

import { MuseRegisterForm } from "@modules/account/components/muse-account/auth-forms"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your MUSE account.",
}

export default function RegisterPage() {
  return <MuseRegisterForm />
}
