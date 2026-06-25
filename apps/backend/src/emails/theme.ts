// Gmail strips <link>/@import web fonts entirely, so "Inter" (used by the
// approved HTML mockup) never loads in the actual email — it silently falls
// back to whatever's first in this stack. -apple-system/Segoe UI give a
// notably more modern look than plain Arial on Mac/Windows while still
// degrading safely everywhere else.
export const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export const colors = {
  black: "#0A0A0A",
  cream: "#F4F2ED",
  creamDeep: "#ECE9E2",
  yellow: "#C8D050",
  green: "#1F7A3A",
  greenSoft: "#EBF5EE",
  blue: "#2563EB",
  blueSoft: "#EEF4FF",
  text: "#1A1A1A",
  muted: "#666666",
  border: "#E8E6E0",
  white: "#FFFFFF",
}

export type FulfillmentType = "nzstock" | "standard"

const SLA: Record<FulfillmentType, [number, number]> = {
  nzstock: [3, 5],
  standard: [13, 16],
}

const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const formatEta = (createdAt: string, type: FulfillmentType) => {
  const [minimum, maximum] = SLA[type]
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  }
  const created = new Date(createdAt)

  return `${addDays(created, minimum).toLocaleDateString("en-NZ", options)} – ${addDays(created, maximum).toLocaleDateString("en-NZ", options)}`
}

// Medusa amounts are already stored as display currency, not cents.
export const formatMoney = (amount: number, currencyCode: string) =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    currencyDisplay: "narrowSymbol",
  }).format(amount)

export const logoUrl =
  process.env.MUSE_EMAIL_LOGO_URL || "https://store.musenz.com/muse-logo-long.png"

// Used by the MUSE Pay confirmation email — payment 1 of 4 charges on
// order.created_at itself (the Stripe subscription schedule's start_date is
// "now"), then one further charge every 7 days after that.
export const formatPaymentDate = (createdAt: string, daysFromCreation: number) => {
  const date = addDays(new Date(createdAt), daysFromCreation)
  return date.toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" })
}
