import { Metadata } from "next"

import { MuseResetPasswordForm } from "@modules/account/components/muse-account/auth-forms"

type Props = {
  searchParams: Promise<{
    email?: string
    token?: string
  }>
}

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new MUSE account password.",
}

export default async function ResetPasswordPage(props: Props) {
  const searchParams = await props.searchParams

  return (
    <MuseResetPasswordForm
      email={searchParams.email}
      token={searchParams.token}
    />
  )
}
