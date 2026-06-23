import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: window.location.origin,
  auth: { type: "session" },
})
