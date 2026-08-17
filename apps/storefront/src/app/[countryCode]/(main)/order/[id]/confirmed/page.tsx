import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import MetaPurchaseTracker from "@modules/analytics/components/meta-purchase-tracker"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  const contents = ((order.items ?? []) as HttpTypes.StoreOrderLineItem[])
    .filter(
      (item) =>
        (item.product_title ?? item.title ?? "").trim().toLowerCase() !==
        "shipping protection"
    )
    .map((item) => ({
      id: item.product_id ?? item.variant_id ?? item.variant?.id ?? item.id,
      quantity: item.quantity,
      item_price: item.unit_price ?? 0,
    }))

  return (
    <>
      <MetaPurchaseTracker
        orderId={order.id}
        currency={order.currency_code || "nzd"}
        value={order.total ?? 0}
        contents={contents}
      />
      <OrderCompletedTemplate order={order} />
    </>
  )
}
