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
  // Off-white rather than pure #FFFFFF — visually identical, but some
  // mobile mail clients specifically target pure white/black as "needs
  // dark-mode conversion" signals, so a value that isn't quite pure white
  // is less likely to trip that heuristic.
  white: "#FFFEFC",
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

/**
 * Gmail's mobile apps run their own "smart" dark-mode pass that recolors
 * (effectively inverts) any background it doesn't trust — it doesn't honor
 * the color-scheme meta tags Apple Mail/Outlook respect. The documented
 * workaround (Litmus/Email on Acid) is the legacy HTML `bgcolor` attribute:
 * Gmail treats it as an explicit, intentional color and leaves it alone.
 * `td` isn't typed with `bgcolor` in React's DOM types even though every
 * browser supports it on table cells, hence the cast.
 */
export function bgcolor(color: string) {
  return { bgcolor: color } as { bgcolor: string }
}

/**
 * `bgcolor` attributes alone didn't stop Gmail's mobile app from inverting
 * the email (confirmed: header went from black to white, page background
 * from cream to dark gray, on-device — desktop Gmail/webmail was fine).
 * The other half of the standard fix is to stop declaring "light only"
 * support (which some clients read as "this sender has no dark variant,
 * I'll synthesize one") and instead explicitly declare a dark variant —
 * then make that dark variant's colors identical to the light ones via
 * `!important`, using `[data-ogsc]` (Gmail webmail's dark-mode wrapper
 * attribute) and the standard `prefers-color-scheme: dark` media query.
 * Apply the matching class name to every element with one of these
 * backgrounds — see bgClass() below.
 */
export const DARK_MODE_OVERRIDE_STYLE = `
@media (prefers-color-scheme: dark) {
  .em-bg-page, [data-ogsc] .em-bg-page { background-color: ${colors.creamDeep} !important; }
  .em-bg-dark, [data-ogsc] .em-bg-dark { background-color: ${colors.black} !important; }
  .em-bg-card, [data-ogsc] .em-bg-card { background-color: ${colors.white} !important; }
  .em-bg-soft, [data-ogsc] .em-bg-soft { background-color: ${colors.creamDeep} !important; }
}
[data-ogsc] .em-bg-page { background-color: ${colors.creamDeep} !important; }
[data-ogsc] .em-bg-dark { background-color: ${colors.black} !important; }
[data-ogsc] .em-bg-card { background-color: ${colors.white} !important; }
[data-ogsc] .em-bg-soft { background-color: ${colors.creamDeep} !important; }
`

export const logoUrl =
  process.env.MUSE_EMAIL_LOGO_URL || "https://store.musenz.com/muse-logo-long.png"

// Real hosted PNG icons — Gmail strips inline <svg> from email bodies and
// doesn't reliably render .svg <img> sources either, so every icon (social
// or functional) needs to be a raster image. Generated locally via Pillow
// (see apps/storefront/public/email-icons/generate_icons.py) rather than
// guessed at a third-party icon CDN URL.
const EMAIL_ICON_BASE_URL =
  process.env.MUSE_EMAIL_ICON_BASE_URL || "https://store.musenz.com/email-icons"

export const icons = {
  instagram: `${EMAIL_ICON_BASE_URL}/social-instagram.png`,
  facebook: `${EMAIL_ICON_BASE_URL}/social-facebook.png`,
  calendar: `${EMAIL_ICON_BASE_URL}/icon-calendar.png`,
  track: `${EMAIL_ICON_BASE_URL}/icon-track.png`,
  chat: `${EMAIL_ICON_BASE_URL}/icon-chat.png`,
  card: `${EMAIL_ICON_BASE_URL}/icon-card.png`,
}

// Used by the MUSE Pay confirmation email — payment 1 of 4 charges on
// order.created_at itself (the Stripe subscription schedule's start_date is
// "now"), then one further charge every 7 days after that.
export const formatPaymentDate = (createdAt: string, daysFromCreation: number) => {
  const date = addDays(new Date(createdAt), daysFromCreation)
  return date.toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" })
}
