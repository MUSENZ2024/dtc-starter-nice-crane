import { discoverySubject, WELCOME_FLOW_STEPS } from "../../modules/marketing/welcome-flow"

describe("first-time welcome flow", () => {
  it("uses the exact five scheduled offsets", () => {
    expect(WELCOME_FLOW_STEPS.map((step) => step.delay_minutes)).toEqual([0, 1320, 2880, 4320, 6480])
  })

  it.each([
    ["footwear", "Four MUSE pieces worth knowing about"],
    ["outerwear", "Four MUSE pieces worth knowing about"],
    ["restocks", "Four MUSE pieces worth knowing about"],
    ["everything", "Four MUSE pieces worth knowing about"],
  ])("selects the %s discovery subject", (preference, subject) => expect(discoverySubject(preference)).toBe(subject))

})
