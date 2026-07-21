export type MarketingSubscriber = {
  id: string
  email: string
  customer_id?: string | null
  first_name?: string | null
  last_name?: string | null
  status: "subscribed" | "unsubscribed" | "suppressed" | "pending"
  customer_type: "first_time" | "returning" | "unknown"
  primary_preference: "footwear" | "outerwear" | "restocks" | "everything"
  source_first: string
  source_latest: string
  subscribed_at: string
  unsubscribed_at?: string | null
  suppression_reason?: string | null
  order_count: number
  lifetime_revenue: number | string
  consent_events?: Array<{
    id: string
    action: string
    source: string
    consent_text: string
    privacy_policy_version: string
    occurred_at: string
  }>
  preference_events?: Array<{
    id: string
    preference: string
    source: string
    occurred_at: string
  }>
}

export type MarketingSubscribersResponse = {
  subscribers: MarketingSubscriber[]
  count: number
  limit: number
  offset: number
}
