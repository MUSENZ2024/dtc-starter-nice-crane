import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../modules/marketing"
import MarketingModuleService from "../modules/marketing/service"
import { cancelMarketingEnrollmentsWorkflow } from "../workflows/marketing/cancel-marketing-enrollments"
import { numberValue, selectAttribution } from "../lib/marketing-reporting"

export default async function marketingOrderPlaced({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "email", "currency_code", "total", "discount_total", "created_at", "customer.id", "promotions.*"],
    filters: { id: data.id },
  })
  const order = orders[0] as any
  if (!order?.email) return
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const existing = await service.listMarketingAttributionEvents({ order_id: data.id }, { take: 1 })
  if (existing.length) return
  let [subscriber] = order.customer?.id ? await service.listMarketingSubscribers({ customer_id: order.customer.id }, { take: 1 }) : []
  if (!subscriber) [subscriber] = await service.listMarketingSubscribers({ email_normalized: order.email.trim().toLowerCase() }, { take: 1 })
  if (!subscriber) return

  const codes = (order.promotions || []).map((promotion: { code?: string }) => promotion.code).filter(Boolean)
  const [issuance] = codes.length ? await service.listMarketingOfferIssuances({ subscriber_id: subscriber.id, code: codes }, { take: 1 }) : []
  const emailEvents = await service.listMarketingEmailEvents({ subscriber_id: subscriber.id }, { take: 1000, relations: ["enrollment"] })
  const attribution = selectAttribution({ promotion: issuance ? { id: issuance.id } : undefined, emails: emailEvents, ordered_at: new Date(order.created_at) })
  const selectedEmail = attribution.email as any
  const amount = numberValue(order.total)
  const discount = numberValue(order.discount_total)

  await service.createMarketingAttributionEvents({
    subscriber_id: subscriber.id,
    email_event_id: selectedEmail?.id || null,
    enrollment_id: selectedEmail?.enrollment_id || null,
    campaign_id: selectedEmail?.campaign_id || null,
    event_type: attribution.event_type,
    order_id: order.id,
    amount,
    discount_amount: discount,
    currency_code: (order.currency_code || "nzd").toLowerCase(),
    occurred_at: new Date(order.created_at),
    metadata: { source: subscriber.source_first, promotion_code: issuance?.code || null },
  })
  await service.updateMarketingSubscribers({ id: subscriber.id, customer_id: subscriber.customer_id || order.customer?.id || null, customer_type: "returning", order_count: subscriber.order_count + 1, lifetime_revenue: numberValue(subscriber.lifetime_revenue) + amount })
  if (issuance) await service.updateMarketingOfferIssuances({ id: issuance.id, status: "redeemed", redeemed_at: new Date(order.created_at), redeemed_order_id: order.id, discount_amount_realized: discount })
  await cancelMarketingEnrollmentsWorkflow(container).run({ input: { subscriber_id: subscriber.id, reason: "purchased", order_id: data.id } })
  const converted = await service.listMarketingEnrollments({ subscriber_id: subscriber.id, converted_order_id: order.id })
  if (converted.length) await service.updateMarketingEnrollments(converted.map((item) => ({ id: item.id, attributed_revenue: amount, attribution_currency: (order.currency_code || "nzd").toLowerCase() })))
}
export const config: SubscriberConfig = { event: "order.placed" }
