export const MARKETING_SUBSCRIBER_STATUSES = [
  "subscribed",
  "unsubscribed",
  "suppressed",
  "pending",
] as const

export const MARKETING_CUSTOMER_TYPES = [
  "first_time",
  "returning",
  "unknown",
] as const

export const MARKETING_PREFERENCES = [
  "footwear",
  "outerwear",
  "restocks",
  "everything",
] as const

export const MARKETING_SOURCES = [
  "welcome_popup",
  "homepage_drop_access",
  "footer_signup",
  "checkout_opt_in",
  "account_opt_in",
  "admin_import",
  "admin_manual",
  "campaign_landing_page",
] as const

export const MARKETING_CONSENT_ACTIONS = [
  "subscribed",
  "unsubscribed",
  "resubscribed",
  "suppressed",
  "consent_updated",
] as const

export type MarketingPreference = (typeof MARKETING_PREFERENCES)[number]
export type MarketingSource = (typeof MARKETING_SOURCES)[number]

export const MARKETING_OFFER_STATUSES = ["draft", "active", "paused", "archived"] as const
export const MARKETING_OFFER_AMOUNT_TYPES = ["fixed", "percentage"] as const
export const MARKETING_ISSUANCE_STATUSES = ["active", "redeemed", "expired", "revoked"] as const
export type MarketingOfferStatus = (typeof MARKETING_OFFER_STATUSES)[number]
export type MarketingOfferAmountType = (typeof MARKETING_OFFER_AMOUNT_TYPES)[number]
export type MarketingIssuanceStatus = (typeof MARKETING_ISSUANCE_STATUSES)[number]

export const MARKETING_FLOW_TYPES = ["welcome", "vip_welcome", "winback", "restock", "custom"] as const
export const MARKETING_FLOW_STATUSES = ["draft", "active", "paused", "archived"] as const
export const MARKETING_FLOW_STEP_STATUSES = ["draft", "active", "paused"] as const
export const MARKETING_ENROLLMENT_STATUSES = ["active", "completed", "converted", "cancelled", "unsubscribed", "suppressed"] as const
export const MARKETING_EMAIL_EVENT_STATUSES = ["scheduled", "sending", "sent", "delivered", "opened", "clicked", "failed", "cancelled", "bounced", "complained"] as const

export const MARKETING_CAPTURE_EVENT_TYPES = [
  "eligible",
  "popup_viewed",
  "preference_selected",
  "form_viewed",
  "submitted",
  "succeeded",
  "dismissed",
  "error",
] as const

export const MARKETING_ATTRIBUTION_EVENT_TYPES = [
  "promotion",
  "last_click",
  "last_open",
  "unattributed",
] as const

export const MARKETING_SEGMENT_STATUSES = ["active", "archived"] as const
export const MARKETING_CAMPAIGN_STATUSES = ["draft", "scheduled", "sending", "sent", "paused", "cancelled", "failed"] as const
export const MARKETING_CAMPAIGN_RECIPIENT_STATUSES = ["eligible", "excluded", "scheduled", "sent", "failed", "cancelled"] as const
