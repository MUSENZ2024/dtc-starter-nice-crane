import { numberValue } from "./marketing-reporting"

export type SegmentRule = { field: string; operator: string; value?: unknown }
export type SegmentDefinition = { operator?: "and" | "or"; rules: SegmentRule[] }
export type SegmentContext = {
  now?: Date
  emailEvents?: Array<Record<string, any>>
  issuances?: Array<Record<string, any>>
  enrollments?: Array<Record<string, any>>
  recipients?: Array<Record<string, any>>
}

const daysSince = (value: unknown, now: Date) => value ? (now.getTime() - new Date(value as string).getTime()) / 86400000 : Infinity
const compare = (actual: unknown, operator: string, expected: unknown) => {
  if (operator === "eq") return String(actual) === String(expected)
  if (operator === "neq") return String(actual) !== String(expected)
  if (operator === "in") return Array.isArray(expected) && expected.map(String).includes(String(actual))
  if (operator === "not_in") return Array.isArray(expected) && !expected.map(String).includes(String(actual))
  if (operator === "gt") return numberValue(actual) > numberValue(expected)
  if (operator === "gte") return numberValue(actual) >= numberValue(expected)
  if (operator === "lt") return numberValue(actual) < numberValue(expected)
  if (operator === "lte") return numberValue(actual) <= numberValue(expected)
  return false
}

export const matchesSegment = (subscriber: Record<string, any>, definition: SegmentDefinition, context: SegmentContext = {}) => {
  const now = context.now || new Date()
  const values = (rule: SegmentRule): unknown => {
    if (["status", "source_first", "source_latest", "primary_preference", "customer_type", "order_count", "lifetime_revenue"].includes(rule.field)) return subscriber[rule.field]
    if (rule.field === "signup_days_ago") return daysSince(subscriber.subscribed_at, now)
    if (rule.field === "engaged_days_ago") return daysSince(subscriber.last_engaged_at, now)
    if (rule.field === "clicked_within_days") return context.emailEvents?.some((event) => event.subscriber_id === subscriber.id && event.first_clicked_at && daysSince(event.first_clicked_at, now) <= numberValue(rule.value))
    if (rule.field === "opened_within_days") return context.emailEvents?.some((event) => event.subscriber_id === subscriber.id && event.first_opened_at && daysSince(event.first_opened_at, now) <= numberValue(rule.value))
    if (rule.field === "offer_redeemed") return context.issuances?.some((item) => item.subscriber_id === subscriber.id && item.status === "redeemed") || false
    if (rule.field === "received_campaign") return context.recipients?.some((item) => item.subscriber_id === subscriber.id && item.campaign_id === rule.value && item.status === "sent") || false
    if (rule.field === "entered_flow") return context.enrollments?.some((item) => item.subscriber_id === subscriber.id && item.flow_id === rule.value) || false
    return undefined
  }
  const results = (definition.rules || []).map((rule) => {
    const actual = values(rule)
    if (["clicked_within_days", "opened_within_days"].includes(rule.field)) return rule.operator === "false" ? !actual : Boolean(actual)
    if (["offer_redeemed", "received_campaign", "entered_flow"].includes(rule.field)) return rule.operator === "false" ? !actual : Boolean(actual)
    return compare(actual, rule.operator, rule.value)
  })
  return (definition.operator || "and") === "or" ? results.some(Boolean) : results.every(Boolean)
}

export const estimateSegment = (subscribers: Array<Record<string, any>>, definition: SegmentDefinition, context: SegmentContext = {}) => subscribers.filter((subscriber) => matchesSegment(subscriber, definition, context))

export const materializeAudience = ({ subscribers, matchedIds, recentlySentIds, campaignId }: { subscribers: Array<Record<string, any>>; matchedIds: Set<string>; recentlySentIds: Set<string>; campaignId: string }) => {
  const seen = new Set<string>()
  return subscribers.flatMap((subscriber) => {
    if (seen.has(subscriber.id)) return []
    seen.add(subscriber.id)
    const reason = subscriber.status !== "subscribed" ? subscriber.status : !matchedIds.has(subscriber.id) ? "segment_mismatch" : recentlySentIds.has(subscriber.id) ? "frequency_cap" : null
    return [{ campaign_id: campaignId, subscriber_id: subscriber.id, email: subscriber.email_normalized, status: reason ? "excluded" as const : "scheduled" as const, exclusion_reason: reason }]
  })
}

export const INITIAL_MARKETING_SEGMENTS: Array<{ key: string; name: string; description: string; definition: SegmentDefinition }> = [
  { key: "new-no-order-7d", name: "New subscribers, no order, 7 days", description: "Recent subscribers who have not purchased.", definition: { rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "order_count", operator: "eq", value: 0 }, { field: "signup_days_ago", operator: "lte", value: 7 }] } },
  { key: "footwear-interest", name: "Footwear interest", description: "Subscribers preferring footwear.", definition: { rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "primary_preference", operator: "eq", value: "footwear" }] } },
  { key: "outerwear-interest", name: "Outerwear interest", description: "Subscribers preferring outerwear.", definition: { rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "primary_preference", operator: "eq", value: "outerwear" }] } },
  { key: "restock-interest", name: "Restock interest", description: "Subscribers preferring restocks.", definition: { rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "primary_preference", operator: "eq", value: "restocks" }] } },
  { key: "returning-vip", name: "Returning VIP customers", description: "Returning customers with at least NZ$500 lifetime revenue.", definition: { rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "customer_type", operator: "eq", value: "returning" }, { field: "lifetime_revenue", operator: "gte", value: 500 }] } },
  { key: "engaged-30d", name: "Engaged 30 days", description: "Opened or clicked within 30 days.", definition: { operator: "and", rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "clicked_within_days", operator: "true", value: 30 }] } },
  { key: "unengaged-90d", name: "Unengaged 90 days", description: "No engagement within 90 days.", definition: { rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "engaged_days_ago", operator: "gt", value: 90 }] } },
  { key: "high-value", name: "High-value customers", description: "Customers with NZ$500 or more lifetime revenue.", definition: { rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "lifetime_revenue", operator: "gte", value: 500 }] } },
  { key: "welcome-not-redeemed", name: "Welcome offer not redeemed", description: "First-time subscribers without a redeemed offer.", definition: { rules: [{ field: "status", operator: "eq", value: "subscribed" }, { field: "customer_type", operator: "eq", value: "first_time" }, { field: "offer_redeemed", operator: "false" }] } },
]
