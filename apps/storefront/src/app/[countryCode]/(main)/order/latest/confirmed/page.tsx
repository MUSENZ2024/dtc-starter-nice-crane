import { listOrders } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Latest Order Confirmed",
  description: "Preview the latest order confirmation page",
}

export default async function LatestOrderConfirmedPage() {
  const orders = await listOrders(1).catch(() => [])
  const order = orders?.[0]

  if (!order) {
    return notFound()
  }

  return <OrderCompletedTemplate order={order} />
}
