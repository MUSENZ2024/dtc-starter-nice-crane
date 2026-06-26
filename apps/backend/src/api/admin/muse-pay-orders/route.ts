import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type RawOrder = {
  id: string
  display_id: number | string
  created_at: string
  currency_code: string
  total: number
  email?: string | null
  metadata?: Record<string, unknown> | null
  payment_status?: string | null
  fulfillment_status?: string | null
  shipping_address?: { first_name?: string | null; last_name?: string | null } | null
}

/**
 * The built-in admin Order list can't be customized to show a per-row "MUSE
 * Pay" badge or swap its Customer column to a shipping-address name — both
 * are core dashboard code, outside the widget/UI-route extension surface.
 * This route backs a separate custom admin page (see
 * src/admin/routes/muse-pay-orders/page.tsx) that has neither limitation.
 *
 * Order-level metadata is the source of truth for "is this a MUSE Pay
 * order" — stamped on the cart before checkout completion (see
 * apps/storefront/src/app/api/split-pay/complete/route.ts) and copied onto
 * the order by completeCartWorkflow. There's no dedicated list filter for
 * arbitrary metadata in the admin order API, so this fetches a recent batch
 * and filters in memory — fine at this store's order volume; revisit with a
 * real query filter if that changes.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "currency_code",
      "total",
      "email",
      "metadata",
      "payment_status",
      "fulfillment_status",
      "shipping_address.first_name",
      "shipping_address.last_name",
    ],
    pagination: {
      order: { created_at: "DESC" },
      take: 500,
    },
  })

  const musePayOrders = (orders as RawOrder[])
    .filter((order) => order.metadata?.muse_split_pay === "true")
    .map((order) => ({
      id: order.id,
      display_id: order.display_id,
      created_at: order.created_at,
      currency_code: order.currency_code,
      total: order.total,
      customer_name:
        [order.shipping_address?.first_name, order.shipping_address?.last_name]
          .filter(Boolean)
          .join(" ") || order.email || "Unknown",
      email: order.email ?? null,
      payment_status: order.payment_status ?? null,
      fulfillment_status: order.fulfillment_status ?? null,
      split_pay_schedule_id: order.metadata?.split_pay_schedule_id ?? null,
    }))

  res.json({ orders: musePayOrders, count: musePayOrders.length })
}
