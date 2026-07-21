import { aucklandDateKey, buildMarketingReport, formatNZD, reconcileAttributions, reportingRange, selectAttribution } from "../marketing-reporting"

const range = reportingRange("2026-07-01", "2026-07-31", new Date("2026-07-21T00:00:00Z"))
const subscriber = { id: "sub_1", status: "subscribed", source_first: "welcome_popup", subscribed_at: "2026-07-01T12:00:00Z" }

describe("marketing reporting", () => {
  test("reconciles raw events without double-counting order revenue", () => {
    const duplicateOrder = { order_id: "ord_1", subscriber, event_type: "last_click", amount: 180, discount_amount: 20, occurred_at: "2026-07-10T12:00:00Z" }
    const report = buildMarketingReport({ subscribers: [subscriber], captures: [{ event_type: "eligible", occurred_at: "2026-07-01T12:00:00Z" }, { event_type: "popup_viewed", occurred_at: "2026-07-01T12:01:00Z" }, { event_type: "succeeded", occurred_at: "2026-07-01T12:02:00Z" }], emails: [{ subscriber_id: "sub_1", status: "clicked", sent_at: "2026-07-09T12:00:00Z", first_clicked_at: "2026-07-09T13:00:00Z" }], enrollments: [{ status: "converted", entered_at: "2026-07-01T12:02:00Z" }], issuances: [{ status: "redeemed", issued_at: "2026-07-01T12:02:00Z" }], attributions: [duplicateOrder, { ...duplicateOrder }], range })
    expect(report.kpis.attributed_orders).toBe(1)
    expect(report.kpis.attributed_revenue).toBe(180)
    expect(report.kpis.discount_cost).toBe(20)
    expect(report.kpis.net_attributed_revenue).toBe(160)
    expect(report.funnel.signup_conversion_rate).toBe(1)
    expect(report.sources[0]).toMatchObject({ source: "welcome_popup", subscribers: 1, attributed_orders: 1, revenue: 180 })
  })

  test("deduplicates attribution fixtures by order id", () => expect(reconcileAttributions([{ order_id: "a", amount: 1 }, { order_id: "a", amount: 1 }, { order_id: "b", amount: 2 }])).toHaveLength(2))
  test("formats NZD and Auckland dates", () => { expect(formatNZD(180)).toMatch(/180\.00/); expect(aucklandDateKey("2026-07-20T13:30:00Z")).toBe("2026-07-21") })
  test("uses identical inclusive Auckland date filters", () => { expect(range.start.toISOString()).toBe("2026-06-30T12:00:00.000Z"); expect(range.end.toISOString()).toBe("2026-07-31T11:59:59.999Z") })
  test("applies deterministic promotion, click, then open attribution", () => {
    const ordered_at = new Date("2026-07-10T12:00:00Z")
    expect(selectAttribution({ promotion: { id: "i" }, emails: [], ordered_at }).event_type).toBe("promotion")
    expect(selectAttribution({ emails: [{ first_clicked_at: "2026-07-09T12:00:00Z" }], ordered_at }).event_type).toBe("last_click")
    expect(selectAttribution({ emails: [{ first_opened_at: "2026-07-10T06:00:00Z" }], ordered_at }).event_type).toBe("last_open")
  })
})
