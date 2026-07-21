import { randomBytes } from "node:crypto"

export const WELCOME_OFFER_KEY = "welcome_nzd20_150_v1"
export const WELCOME_OFFER_DEFAULTS = {
  key: WELCOME_OFFER_KEY,
  name: "$20 welcome offer",
  status: "draft" as const,
  amount_type: "fixed" as const,
  amount: 20,
  currency_code: "nzd",
  minimum_spend: 150,
  expires_after_hours: 120,
  first_order_only: true,
  combinable: false,
  excluded_product_ids: { ids: [] },
  excluded_category_ids: { ids: [] },
  excluded_tag_ids: { ids: [] },
  metadata: { version: 1, purpose: "welcome" },
}

export const generateWelcomeOfferCode = () =>
  `MUSE20-${randomBytes(4).toString("hex").toUpperCase()}`

export const offerExpiry = (issuedAt: Date, hours: number) =>
  new Date(issuedAt.getTime() + hours * 60 * 60 * 1000)
