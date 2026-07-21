import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export const MARKETING_CONSENT_VERSION = "2026-07-21-v1"
export const MARKETING_PRIVACY_POLICY_VERSION = "2026-07-21"
export const MARKETING_CONSENT_TEXT =
  "By joining, you agree to receive MUSE NZ marketing emails about new drops, restocks and offers. You can unsubscribe at any time. See our Privacy Policy."

const tokenSecret = () => {
  const value = process.env.MARKETING_TOKEN_SECRET || process.env.JWT_SECRET
  if (!value) {
    throw new Error("MARKETING_TOKEN_SECRET or JWT_SECRET is required")
  }
  return value
}

export const normalizeMarketingEmail = (email: string) =>
  email.trim().toLowerCase()

export const hashMarketingIp = (ip?: string | null) => {
  if (!ip) return null
  return createHash("sha256")
    .update(`${tokenSecret()}:${ip}`)
    .digest("hex")
}

export const hashMarketingSession = (sessionId: string) =>
  createHash("sha256")
    .update(`${tokenSecret()}:session:${sessionId}`)
    .digest("hex")

export const summarizeUserAgent = (value?: string | null) =>
  value ? value.replace(/[\r\n]/g, " ").slice(0, 240) : null

export const createMarketingToken = (subscriberId: string) => {
  const payload = Buffer.from(
    JSON.stringify({ subscriber_id: subscriberId, version: 1 }),
  ).toString("base64url")
  const signature = createHmac("sha256", tokenSecret())
    .update(payload)
    .digest("base64url")
  return `${payload}.${signature}`
}

export const verifyMarketingToken = (token: string) => {
  const [payload, signature, extra] = token.split(".")
  if (!payload || !signature || extra) return null

  const expected = createHmac("sha256", tokenSecret())
    .update(payload)
    .digest("base64url")
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString())
    return decoded?.version === 1 && typeof decoded?.subscriber_id === "string"
      ? decoded.subscriber_id
      : null
  } catch {
    return null
  }
}
