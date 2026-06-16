import { Metadata } from "next"

import { MuseForgotPasswordForm } from "@modules/account/components/muse-account/auth-forms"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a MUSE account reset link.",
}

export default function ForgotPasswordPage() {
  return <MuseForgotPasswordForm />
}
