import { generateWelcomeOfferCode, offerExpiry } from "../../modules/marketing/offers"

describe("marketing welcome offers", () => {
  it("personalizes codes with the first name and four random digits", () => {
    const codes = Array.from({ length: 20 }, () => generateWelcomeOfferCode("James"))

    for (const code of codes) expect(code).toMatch(/^JAMES\d{4}$/)
    expect(new Set(codes).size).toBeGreaterThan(1)
  })

  it("normalizes names and falls back safely when a name is unavailable", () => {
    expect(generateWelcomeOfferCode("Chloé-Rose")).toMatch(/^CHLOEROSE\d{4}$/)
    expect(generateWelcomeOfferCode("' Ana Maria '")).toMatch(/^ANAMARIA\d{4}$/)
    expect(generateWelcomeOfferCode()).toMatch(/^MUSE\d{4}$/)
  })

  it("expires exactly 120 hours after issuance", () => {
    const issuedAt = new Date("2026-07-21T00:00:00.000Z")
    expect(offerExpiry(issuedAt, 120).toISOString()).toBe("2026-07-26T00:00:00.000Z")
  })
})
