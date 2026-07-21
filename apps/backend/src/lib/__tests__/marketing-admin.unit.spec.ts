import { csvCell, safeEmailEvent, subscriberFilters } from "../marketing-admin"

describe("marketing admin safety", () => {
  it("maps supported subscriber filters and purchase state", () => {
    expect(subscriberFilters({ q: " TEST@EXAMPLE.COM ", status: "subscribed", primary_preference: "footwear", has_purchased: "true" })).toEqual({ email_normalized: { $like: "%test@example.com%" }, status: "subscribed", primary_preference: "footwear", order_count: { $gt: 0 } })
  })

  it("never exposes tracking tokens, snapshots, or provider identifiers", () => {
    const safe = safeEmailEvent({ id: "evt_1", status: "scheduled", tracking_token: "secret", content_snapshot: { unsubscribe_token: "secret" }, provider_notification_id: "provider-secret", subscriber: { id: "sub_1", email: "test@example.com", status: "subscribed" } }) as Record<string, unknown>
    expect(safe.tracking_token).toBeUndefined()
    expect(safe.content_snapshot).toBeUndefined()
    expect(safe.provider_notification_id).toBeUndefined()
  })

  it("escapes CSV quotes and neutralises spreadsheet formulas", () => {
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"')
  })
})
