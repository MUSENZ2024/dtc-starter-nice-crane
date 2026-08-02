import { randomInt } from "node:crypto"

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

const welcomeCodeName = (firstName?: string | null) => {
  const normalized = (firstName || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20)

  return normalized || "MUSE"
}

export const generateWelcomeOfferCode = (firstName?: string | null) =>
  `${welcomeCodeName(firstName)}${randomInt(0, 10_000).toString().padStart(4, "0")}`

export const offerExpiry = (issuedAt: Date, hours: number) =>
  new Date(issuedAt.getTime() + hours * 60 * 60 * 1000)
