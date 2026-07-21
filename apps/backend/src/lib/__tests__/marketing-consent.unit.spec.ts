import {
  createMarketingToken,
  hashMarketingIp,
  normalizeMarketingEmail,
  summarizeUserAgent,
  verifyMarketingToken,
} from "../marketing-consent"

describe("marketing consent utilities", () => {
  beforeAll(() => {
    process.env.MARKETING_TOKEN_SECRET = "unit-test-marketing-secret"
  })

  it("normalises equivalent email identities", () => {
    expect(normalizeMarketingEmail("  Customer@Example.COM ")).toBe(
      "customer@example.com",
    )
  })

  it("signs and verifies opaque subscriber tokens", () => {
    const token = createMarketingToken("msub_test")
    expect(verifyMarketingToken(token)).toBe("msub_test")
    expect(verifyMarketingToken(`${token}tampered`)).toBeNull()
  })

  it("hashes IP evidence and bounds user-agent evidence", () => {
    expect(hashMarketingIp("127.0.0.1")).toMatch(/^[a-f0-9]{64}$/)
    expect(summarizeUserAgent(`browser\n${"x".repeat(300)}`)).toHaveLength(240)
  })
})
