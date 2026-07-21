export type MarketingPreference =
  | "footwear"
  | "outerwear"
  | "restocks"
  | "everything"

export type MarketingSource =
  | "welcome_popup"
  | "homepage_drop_access"
  | "footer_signup"

export type MarketingSubscribeStatus =
  | "subscribed"
  | "already_subscribed"
  | "preference_updated"

export type MarketingSubscribeResponse = {
  success: true
  status: MarketingSubscribeStatus
  message: string
}
