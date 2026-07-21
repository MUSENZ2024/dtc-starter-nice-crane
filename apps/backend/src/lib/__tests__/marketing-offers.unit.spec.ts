import { generateWelcomeOfferCode, offerExpiry } from "../../modules/marketing/offers"

describe("marketing welcome offers", () => {
  it("generates non-sequential codes in the required format", () => {
    const codes = new Set(Array.from({ length: 100 }, generateWelcomeOfferCode))
    expect(codes.size).toBe(100)
    for (const code of codes) expect(code).toMatch(/^MUSE20-[A-F0-9]{8}$/)
  })

  it("expires exactly 120 hours after issuance", () => {
    const issuedAt = new Date("2026-07-21T00:00:00.000Z")
    expect(offerExpiry(issuedAt, 120).toISOString()).toBe("2026-07-26T00:00:00.000Z")
  })
})
