import {
  isHistoricalWelcomeOrder,
  postEnrollmentOrderFilters,
} from "../marketing-welcome-purchase"

describe("welcome purchase exit", () => {
  const enteredAt = new Date("2026-07-24T05:51:14.000Z")

  it("queries only orders created after the welcome enrollment", () => {
    expect(
      postEnrollmentOrderFilters("customer@example.com", enteredAt),
    ).toEqual({
      email: "customer@example.com",
      created_at: { $gte: enteredAt },
    })
  })

  it("recognizes a historical order as safe for a legacy welcome retry", () => {
    expect(
      isHistoricalWelcomeOrder(
        new Date("2026-07-01T00:00:00.000Z"),
        enteredAt,
      ),
    ).toBe(true)
    expect(isHistoricalWelcomeOrder(enteredAt, enteredAt)).toBe(false)
  })
})
