import { Metadata } from "next"

import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import MuseOverview from "@modules/account/components/muse-account/overview"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders(10).catch(() => [])) || []

  if (!customer) {
    notFound()
  }

  return (
    <MuseOverview
      customer={customer}
      orders={orders}
      countryCode={params.countryCode}
    />
  )
}
