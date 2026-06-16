import { Metadata } from "next"

import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import MuseProfile from "@modules/account/components/muse-account/profile"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your Medusa Store profile.",
}

export default async function Profile() {
  const customer = await retrieveCustomer()

  if (!customer) {
    notFound()
  }

  return <MuseProfile customer={customer} />
}
