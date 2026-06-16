import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import MuseClaimOrder from "@modules/account/components/muse-account/claim-order"

export const metadata: Metadata = {
  title: "Link order",
  description: "Add a previous MUSE order to your account.",
}

export default async function ClaimOrderPage() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    notFound()
  }

  return <MuseClaimOrder />
}
