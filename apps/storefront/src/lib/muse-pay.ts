const enabledValues = new Set(["1", "true", "yes", "on"])

export const isMusePayEnabled = enabledValues.has(
  (process.env.NEXT_PUBLIC_MUSE_PAY_ENABLED || "").toLowerCase()
)
