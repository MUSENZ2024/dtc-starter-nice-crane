export const MARKETING_TIME_ZONE = "Pacific/Auckland"
export const MONTHLY_ALLOWANCE = 10_000
export const DAILY_PROVIDER_LIMIT = 1_500
export const DAILY_DISPATCH_CAP = 1_350

export const numberValue = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") return Number(value) || 0
  if (value && typeof value === "object" && "value" in value) return Number((value as { value: unknown }).value) || 0
  return 0
}

export const rate = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator : 0
export const formatNZD = (amount: number) => new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(amount)

export const aucklandDateKey = (value: Date | string) => new Intl.DateTimeFormat("en-CA", {
  timeZone: MARKETING_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date(value))

const timeZoneOffsetMs = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKETING_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {})
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)) - date.getTime()
}

export const aucklandBoundary = (dateKey: string, end = false) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error("Dates must use YYYY-MM-DD")
  const [year, month, day] = dateKey.split("-").map(Number)
  const approximate = new Date(Date.UTC(year, month - 1, day + (end ? 1 : 0)))
  return new Date(approximate.getTime() - timeZoneOffsetMs(approximate) - (end ? 1 : 0))
}

export const reportingRange = (from?: string, to?: string, now = new Date()) => {
  const toKey = to || aucklandDateKey(now)
  const fallback = new Date(now); fallback.setUTCDate(fallback.getUTCDate() - 29)
  const fromKey = from || aucklandDateKey(fallback)
  const start = aucklandBoundary(fromKey)
  const end = aucklandBoundary(toKey, true)
  if (start > end) throw new Error("From date must be before to date")
  return { from: fromKey, to: toKey, start, end, time_zone: MARKETING_TIME_ZONE }
}

type Row = Record<string, any>
export type ReportingInput = {
  subscribers: Row[]; captures: Row[]; emails: Row[]; enrollments: Row[]; issuances: Row[]; attributions: Row[]
  abandoned?: { active_carts: number; recovered_revenue: number }
  range: ReturnType<typeof reportingRange>; now?: Date
}

const inRange = (value: unknown, range: ReportingInput["range"]) => {
  if (!value) return false
  const time = new Date(value as string).getTime()
  return time >= range.start.getTime() && time <= range.end.getTime()
}

export const reconcileAttributions = (rows: Row[]) => {
  const orders = new Map<string, Row>()
  for (const row of rows) {
    if (!row.order_id || orders.has(row.order_id)) continue
    orders.set(row.order_id, row)
  }
  return [...orders.values()]
}

export const buildMarketingReport = (input: ReportingInput) => {
  const now = input.now || new Date()
  const captures = input.captures.filter((item) => inRange(item.occurred_at, input.range))
  const emails = input.emails.filter((item) => inRange(item.sent_at || item.scheduled_at, input.range))
  const enrollments = input.enrollments.filter((item) => inRange(item.entered_at, input.range))
  const issuances = input.issuances.filter((item) => inRange(item.issued_at, input.range))
  const attributions = reconcileAttributions(input.attributions.filter((item) => inRange(item.occurred_at, input.range)))
  const sent = emails.filter((item) => ["sent","delivered","opened","clicked","bounced","complained"].includes(item.status)).length
  const delivered = emails.filter((item) => ["delivered","opened","clicked"].includes(item.status)).length
  const clicked = new Set(emails.filter((item) => item.first_clicked_at || item.status === "clicked").map((item) => item.subscriber_id)).size
  const failed = emails.filter((item) => item.status === "failed").length
  const bounced = emails.filter((item) => item.status === "bounced").length
  const complained = emails.filter((item) => item.status === "complained").length
  const revenue = attributions.reduce((sum, item) => sum + numberValue(item.amount), 0)
  const discount = attributions.reduce((sum, item) => sum + numberValue(item.discount_amount), 0)
  const activeSubscribers = input.subscribers.filter((item) => item.status === "subscribed").length
  const newSubscribers = input.subscribers.filter((item) => inRange(item.subscribed_at, input.range)).length
  const unsubscribes = input.subscribers.filter((item) => inRange(item.unsubscribed_at, input.range)).length
  const eligible = captures.filter((item) => item.event_type === "eligible").length
  const popupViews = captures.filter((item) => item.event_type === "popup_viewed").length
  const preferences = captures.filter((item) => item.event_type === "preference_selected").length
  const successes = captures.filter((item) => item.event_type === "succeeded").length
  const converted = enrollments.filter((item) => item.status === "converted").length
  const redeemed = issuances.filter((item) => item.status === "redeemed").length

  const dayMap = new Map<string, { date: string; subscribers: number; sent: number; delivered: number; clicked: number; revenue: number }>()
  const day = (date: unknown) => {
    const key = aucklandDateKey(date as string)
    if (!dayMap.has(key)) dayMap.set(key, { date: key, subscribers: 0, sent: 0, delivered: 0, clicked: 0, revenue: 0 })
    return dayMap.get(key)!
  }
  input.subscribers.filter((item) => inRange(item.subscribed_at, input.range)).forEach((item) => day(item.subscribed_at).subscribers++)
  emails.forEach((item) => { const bucket = day(item.sent_at || item.scheduled_at); if (["sent","delivered","opened","clicked","bounced","complained"].includes(item.status)) bucket.sent++; if (["delivered","opened","clicked"].includes(item.status)) bucket.delivered++; if (item.first_clicked_at || item.status === "clicked") bucket.clicked++ })
  attributions.forEach((item) => { day(item.occurred_at).revenue += numberValue(item.amount) })

  const sourceMap = new Map<string, { source: string; subscribers: number; attributed_orders: number; revenue: number }>()
  input.subscribers.filter((item) => inRange(item.subscribed_at, input.range)).forEach((item) => {
    const source = item.source_first || "unknown"; const row = sourceMap.get(source) || { source, subscribers: 0, attributed_orders: 0, revenue: 0 }; row.subscribers++; sourceMap.set(source, row)
  })
  attributions.forEach((item) => { const source = item.subscriber?.source_first || item.metadata?.source || "unknown"; const row = sourceMap.get(source) || { source, subscribers: 0, attributed_orders: 0, revenue: 0 }; row.attributed_orders++; row.revenue += numberValue(item.amount); sourceMap.set(source, row) })

  const revenueMap = new Map<string, { channel: string; orders: number; revenue: number; discount: number }>()
  attributions.forEach((item) => { const channel = item.event_type; const row = revenueMap.get(channel) || { channel, orders: 0, revenue: 0, discount: 0 }; row.orders++; row.revenue += numberValue(item.amount); row.discount += numberValue(item.discount_amount); revenueMap.set(channel, row) })

  const monthKey = aucklandDateKey(now).slice(0, 7)
  const todayKey = aucklandDateKey(now)
  const monthSent = input.emails.filter((item) => item.sent_at && aucklandDateKey(item.sent_at).startsWith(monthKey)).length
  const todaySent = input.emails.filter((item) => item.sent_at && aucklandDateKey(item.sent_at) === todayKey).length
  const dayOfMonth = Number(todayKey.slice(8, 10)); const daysInMonth = new Date(Number(todayKey.slice(0,4)), Number(todayKey.slice(5,7)), 0).getDate()
  const forecast = dayOfMonth ? Math.round(monthSent / dayOfMonth * daysInMonth) : monthSent
  const issueRate = rate(failed + bounced + complained, Math.max(sent, 1))
  const alerts = [
    ...(monthSent >= 9000 || forecast >= 9000 ? [{ level: "critical", code: "allowance_critical", message: "Monthly sends or forecast reached 9,000." }] : monthSent >= 7500 || forecast >= 7500 ? [{ level: "warning", code: "allowance_warning", message: "Monthly sends or forecast reached 7,500." }] : []),
    ...(todaySent >= DAILY_DISPATCH_CAP ? [{ level: "critical", code: "daily_cap", message: "Daily marketing dispatch cap reached." }] : []),
    ...(issueRate >= 0.05 ? [{ level: "warning", code: "delivery_health", message: "Failure, bounce and complaint rate is at least 5%." }] : []),
  ]

  return {
    range: { from: input.range.from, to: input.range.to, time_zone: input.range.time_zone }, currency_code: "nzd",
    kpis: { active_subscribers: activeSubscribers, new_subscribers: newSubscribers, unsubscribes, emails_sent: sent, delivery_rate: rate(delivered, sent), click_rate: rate(clicked, delivered), welcome_conversion_rate: rate(converted, enrollments.length), attributed_orders: attributions.length, attributed_revenue: revenue, revenue_per_new_subscriber: rate(revenue, newSubscribers), discount_cost: discount, net_attributed_revenue: revenue - discount, abandoned: input.abandoned || { active_carts: 0, recovered_revenue: 0 } },
    funnel: { eligible_sessions: eligible, popup_views: popupViews, preference_selections: preferences, signups: successes, flow_entrants: enrollments.length, purchasers: converted, popup_view_rate: rate(popupViews, eligible), preference_completion_rate: rate(preferences, popupViews), signup_conversion_rate: rate(successes, popupViews), flow_conversion_rate: rate(converted, enrollments.length), offer_redemption_rate: rate(redeemed, issuances.length) },
    time_series: [...dayMap.values()].sort((a,b) => a.date.localeCompare(b.date)),
    sources: [...sourceMap.values()].map((row) => ({ ...row, conversion_rate: rate(row.attributed_orders, row.subscribers) })).sort((a,b) => b.subscribers - a.subscribers),
    revenue: [...revenueMap.values()].sort((a,b) => b.revenue - a.revenue),
    usage: { month_sent: monthSent, monthly_allowance: MONTHLY_ALLOWANCE, allowance_remaining: Math.max(0, MONTHLY_ALLOWANCE - monthSent), projected_month_sent: forecast, today_sent: todaySent, daily_provider_limit: DAILY_PROVIDER_LIMIT, daily_dispatch_cap: DAILY_DISPATCH_CAP },
    health: { failed, bounced, complained, issue_rate: issueRate, alerts },
  }
}

export const selectAttribution = (input: { promotion?: { id: string }; emails: Row[]; ordered_at: Date }) => {
  if (input.promotion) return { event_type: "promotion" as const, email: null }
  const clickCutoff = input.ordered_at.getTime() - 7 * 86400000
  const click = input.emails.filter((item) => item.first_clicked_at && new Date(item.first_clicked_at).getTime() >= clickCutoff && new Date(item.first_clicked_at) <= input.ordered_at).sort((a,b) => +new Date(b.first_clicked_at) - +new Date(a.first_clicked_at))[0]
  if (click) return { event_type: "last_click" as const, email: click }
  const openCutoff = input.ordered_at.getTime() - 86400000
  const open = input.emails.filter((item) => item.first_opened_at && new Date(item.first_opened_at).getTime() >= openCutoff && new Date(item.first_opened_at) <= input.ordered_at).sort((a,b) => +new Date(b.first_opened_at) - +new Date(a.first_opened_at))[0]
  return open ? { event_type: "last_open" as const, email: open } : { event_type: "unattributed" as const, email: null }
}
