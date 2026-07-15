const WORKER = "https://muse-track.nz-nofilter.workers.dev"

type StatusBadgeProps = {
  fallback: {
    label: string
    className: string
  }
  trackingNumbers?: string[]
}

type TrackingResponse = {
  data?: {
    accepted?: Array<{
      track_info?: TrackingInfo
    }>
  }
}

type TrackingInfo = {
  latest_status?: {
    status?: string
  }
  latest_event?: {
    description?: string
    location?: string
    stage?: string
  }
  tracking?: {
    providers?: Array<{
      events?: Array<{
        description?: string
        location?: string
      }>
    }>
  }
}

const includesAny = (text: string, phrases: string[]) =>
  phrases.some((phrase) => text.includes(phrase))

const statusFromTracking = (tracking?: TrackingInfo | null) => {
  const latest = tracking?.latest_status?.status?.toLowerCase() || ""
  const latestEvent = [
    tracking?.latest_event?.description,
    tracking?.latest_event?.location,
    tracking?.latest_event?.stage,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  const events =
    tracking?.tracking?.providers
      ?.flatMap((provider) => provider.events || [])
      .map((event) =>
        [event.description, event.location].filter(Boolean).join(" ")
      )
      .join(" ")
      .toLowerCase() || ""
  const text = `${latest} ${latestEvent} ${events}`

  if (!text.trim()) {
    return null
  }

  if (includesAny(text, ["delivered", "successfully received", "已妥投"])) {
    return { label: "Delivered", className: "muse-status-delivered" }
  }

  if (
    includesAny(text, [
      "out for delivery",
      "with courier",
      "on vehicle",
      "delivery today",
    ])
  ) {
    return { label: "Out for delivery", className: "muse-status-transit" }
  }

  if (
    includesAny(text, [
      "arrived in new zealand",
      "international arrival",
      "pending border clearance",
      "destination processing",
      "local depot",
      "regional depot",
    ])
  ) {
    return { label: "Arrived in NZ", className: "muse-status-transit" }
  }

  if (includesAny(text, ["exception", "delay", "held", "failed delivery"])) {
    return { label: "Update needed", className: "muse-status-processing" }
  }

  return { label: "In transit", className: "muse-status-transit" }
}

const getLiveTrackingStatus = async (trackingNumber?: string) => {
  if (!trackingNumber) {
    return null
  }

  try {
    const response = await fetch(WORKER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "gettrackinfo",
        body: [{ number: trackingNumber }],
      }),
      cache: "no-store",
    })
    const data = (await response.json()) as TrackingResponse
    return statusFromTracking(data.data?.accepted?.[0]?.track_info)
  } catch {
    return null
  }
}

export default async function OrderStatusBadge({
  fallback,
  trackingNumbers = [],
}: StatusBadgeProps) {
  const trackingNumber = trackingNumbers.find((number) => number.trim())
  const liveStatus = await getLiveTrackingStatus(trackingNumber)
  const status = liveStatus || fallback

  return <span className={`muse-status ${status.className}`}>{status.label}</span>
}
