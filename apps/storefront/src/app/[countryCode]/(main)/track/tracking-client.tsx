"use client"

import { FormEvent, useMemo, useState } from "react"

const WORKER = "https://muse-track.nz-nofilter.workers.dev"

type StateKey =
  | "placed"
  | "processing"
  | "intransit"
  | "arrived"
  | "outfordelivery"
  | "delivered"
  | "delay"

type EventItem = {
  rawTime?: string
  time: string
  desc: string
  loc: string
  carrier?: string
}

type TrackingData = {
  stateKey: StateKey
  labelText: string
  date: string
  bannerClass: string
  icon: string
  stage: string
  detail: string
  activeStep: number
  showLeg: boolean
  showDelay: boolean
  showDelivered: boolean
  events: EventItem[]
}

type TrackInfo = {
  latest_status?: {
    status?: string
  }
  tracking?: {
    providers?: Array<{
      provider?: {
        name?: string
      }
      events?: Array<{
        time_iso?: string
        time_utc?: string
        description?: string
        location?: string
      }>
    }>
  }
}

const STEPS = [
  {
    label: "Order placed",
    tip: "Locked in. Your payment is confirmed and we have everything we need to get this moving.",
  },
  {
    label: "Being prepped",
    tip: "Our team quality-checks and packs your pair at the warehouse before it ships.",
  },
  {
    label: "International transit",
    tip: "On its way from our overseas warehouse. Scans can go quiet for a day or two between hubs - totally normal.",
  },
  {
    label: "Arrived in NZ - NZ Post",
    tip: "Cleared customs and handed over to NZ Post. Tracked and scanned from here to your door.",
  },
  {
    label: "Out for delivery",
    tip: "A NZ Post courier has it today. No action needed - they'll knock or leave it safe.",
  },
]

const STATE_TO_STEP: Record<StateKey, number> = {
  placed: 0,
  processing: 1,
  intransit: 2,
  delay: 2,
  arrived: 3,
  outfordelivery: 4,
  delivered: 5,
}

const STATE_FLAGS: Record<
  StateKey,
  { showLeg: boolean; showDelay: boolean; showDelivered: boolean }
> = {
  placed: { showLeg: true, showDelay: false, showDelivered: false },
  processing: { showLeg: true, showDelay: false, showDelivered: false },
  intransit: { showLeg: true, showDelay: false, showDelivered: false },
  delay: { showLeg: false, showDelay: true, showDelivered: false },
  arrived: { showLeg: false, showDelay: false, showDelivered: false },
  outfordelivery: { showLeg: false, showDelay: false, showDelivered: false },
  delivered: { showLeg: false, showDelay: false, showDelivered: true },
}

const BANNER_COPY: Record<
  StateKey,
  { bannerClass: string; icon: string; stage: string; detail: string }
> = {
  placed: {
    bannerClass: "placed",
    icon: "1",
    stage: "Order placed",
    detail:
      "Confirmation is in your inbox. Your order is locked in and we're getting it ready.",
  },
  processing: {
    bannerClass: "processing",
    icon: "2",
    stage: "Being prepped",
    detail:
      "Quality-checked and packed by the team. You'll get a tracking number once it ships.",
  },
  intransit: {
    bannerClass: "intransit",
    icon: "3",
    stage: "In transit - international leg",
    detail:
      "On its way from our overseas warehouse. International legs usually take about a week before NZ Post picks it up.",
  },
  arrived: {
    bannerClass: "arrived",
    icon: "NZ",
    stage: "Arrived in NZ - with NZ Post",
    detail:
      "Cleared customs and handed to NZ Post. Usually 1 to 3 more days to your door from here.",
  },
  outfordelivery: {
    bannerClass: "outfordelivery",
    icon: "4",
    stage: "Out for delivery",
    detail:
      "A NZ Post courier has got it today. Keep an eye out - they'll knock or leave it safe.",
  },
  delivered: {
    bannerClass: "delivered",
    icon: "OK",
    stage: "Delivered",
    detail:
      "Landed! Tag @muse.nz on Instagram when you wear it and grab 10% off your next order.",
  },
  delay: {
    bannerClass: "intransit",
    icon: "3",
    stage: "In transit - international leg",
    detail:
      "No new scan in 6 days, but that's pretty normal for international transit. It's most likely still moving.",
  },
}

const STAGE_DAYS = [
  { match: ["delivered"], days: 0 },
  { match: ["out for delivery", "with courier", "on vehicle"], days: 0 },
  { match: ["available for pickup", "ready for collection"], days: 1 },
  {
    match: [
      "nz post",
      "nzpost",
      "new zealand",
      "arrived in your country",
      "delivery depot",
    ],
    days: 2,
  },
  { match: ["customs", "cleared", "import"], days: 2 },
  { match: ["plane arriving", "arrived at destination", "arrival"], days: 3 },
  { match: ["airline departure", "departed", "in transit to"], days: 6 },
  { match: ["handed to carrier", "accepted", "processed", "dispatched"], days: 8 },
  { match: ["picked up", "received", "order placed"], days: 10 },
]

async function api(endpoint: string, body: Array<{ number: string }>) {
  const response = await fetch(WORKER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, body }),
  })

  return response.json()
}

function sanitiseLocation(loc?: string) {
  if (!loc) return ""

  const overseas = [
    "CN",
    "China",
    "Shenzhen",
    "Guangzhou",
    "Shanghai",
    "Beijing",
  ]

  if (overseas.some((keyword) => loc.includes(keyword))) {
    return "International Hub"
  }

  return loc
}

function sanitiseCarrier(name: string) {
  const normalised = name.toLowerCase()

  if (normalised.includes("china post") || normalised.includes("cn post")) {
    return "International Carrier"
  }

  if (normalised.includes("nz post") || normalised.includes("new zealand post")) {
    return "NZ Post"
  }

  return "International Carrier"
}

function formatEventTime(isoOrUtc?: string) {
  if (!isoOrUtc) return ""

  return new Date(isoOrUtc).toLocaleString("en-NZ", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function estimateDelivery(latestDesc: string, rawStatus: string) {
  const haystack = `${latestDesc} ${rawStatus}`.toLowerCase()

  for (const stage of STAGE_DAYS) {
    if (stage.match.some((keyword) => haystack.includes(keyword))) {
      const date = new Date()
      date.setDate(date.getDate() + stage.days)
      return { days: stage.days, date }
    }
  }

  const date = new Date()
  date.setDate(date.getDate() + 7)
  return { days: 7, date }
}

function formatETA(date: Date, days: number) {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  }

  if (days === 0) return "Today"
  if (days === 1) return `Tomorrow, ${date.toLocaleDateString("en-NZ", opts)}`
  return date.toLocaleDateString("en-NZ", opts)
}

function deriveState(track: TrackInfo | undefined, events: EventItem[]): StateKey {
  const rawStatus = (track?.latest_status?.status || "")
    .replace(/_/g, " ")
    .toLowerCase()
  const latestDesc = (events[0]?.desc || "").toLowerCase()
  const combined = `${rawStatus} ${latestDesc}`

  if (combined.includes("delivered")) return "delivered"

  if (
    combined.includes("out for delivery") ||
    combined.includes("with courier") ||
    combined.includes("on vehicle") ||
    combined.includes("delivery today")
  ) {
    return "outfordelivery"
  }

  if (
    combined.includes("nz post") ||
    combined.includes("new zealand post") ||
    combined.includes("arrived in your country") ||
    combined.includes("arrived in new zealand") ||
    combined.includes("delivery depot") ||
    combined.includes("customs")
  ) {
    return "arrived"
  }

  if (
    combined.includes("in transit") ||
    combined.includes("departed") ||
    combined.includes("international hub") ||
    combined.includes("airline") ||
    combined.includes("dispatched") ||
    rawStatus.includes("intransit")
  ) {
    if (events.length > 0) {
      const lastEventTime = new Date(events[0].rawTime || "")
      const daysSinceLastEvent =
        (Date.now() - lastEventTime.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceLastEvent > 5) return "delay"
    }

    return "intransit"
  }

  if (
    combined.includes("packed") ||
    combined.includes("packing") ||
    combined.includes("processing") ||
    combined.includes("accepted") ||
    combined.includes("handed to carrier")
  ) {
    return "processing"
  }

  return "placed"
}

function buildTrackingData(track: TrackInfo): TrackingData {
  const providers = track?.tracking?.providers || []
  const events: EventItem[] = []

  providers.forEach((provider) => {
    const carrier = sanitiseCarrier(provider.provider?.name || "Carrier")

    ;(provider.events || []).forEach((event) => {
      const rawTime = event.time_iso || event.time_utc

      events.push({
        rawTime,
        time: formatEventTime(rawTime),
        desc: event.description || "",
        loc: sanitiseLocation(event.location || ""),
        carrier,
      })
    })
  })

  events.sort(
    (a, b) =>
      new Date(b.rawTime || "").getTime() -
      new Date(a.rawTime || "").getTime()
  )

  const stateKey = deriveState(track, events)
  const rawStatus = (track?.latest_status?.status || "")
    .replace(/_/g, " ")
    .toLowerCase()
  const eta = estimateDelivery(events[0]?.desc || "", rawStatus)
  const flags = STATE_FLAGS[stateKey]
  const copy = BANNER_COPY[stateKey]

  return {
    stateKey,
    labelText: stateKey === "delivered" ? "Delivered" : "Estimated arrival",
    date:
      stateKey === "delivered"
        ? events[0]?.time?.split(",")[0] || ""
        : formatETA(eta.date, eta.days),
    ...copy,
    activeStep: STATE_TO_STEP[stateKey],
    ...flags,
    events,
  }
}

function nzPostUrl(trackingNumber: string) {
  const base = "https://www.nzpost.co.nz/tools/tracking"
  return trackingNumber
    ? `${base}?trackid=${encodeURIComponent(trackingNumber)}`
    : base
}

export default function TrackingClient() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [submittedTrackingNumber, setSubmittedTrackingNumber] = useState("")
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [nzPostOpen, setNzPostOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)

  const nzPostHref = useMemo(
    () => nzPostUrl(submittedTrackingNumber),
    [submittedTrackingNumber]
  )
  const hasLookupResult = loading || Boolean(message) || Boolean(data)

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanTrackingNumber = trackingNumber.trim().toUpperCase()
    if (!cleanTrackingNumber) return

    setLoading(true)
    setMessage("")
    setTrackingNumber(cleanTrackingNumber)
    setSubmittedTrackingNumber(cleanTrackingNumber)
    setData(null)

    try {
      const response = await api("gettrackinfo", [{ number: cleanTrackingNumber }])
      const track = response?.data?.accepted?.[0]?.track_info as
        | TrackInfo
        | undefined

      if (!track?.tracking?.providers?.length) {
        await api("register", [{ number: cleanTrackingNumber }])
        setMessage(
          "Tracking registered - check back in 5-10 minutes for the first update."
        )
        return
      }

      const nextData = buildTrackingData(track)

      if (!nextData.events.length) {
        await api("register", [{ number: cleanTrackingNumber }])
        setMessage(
          "Tracking registered - check back in 5-10 minutes for the first update."
        )
        return
      }

      setData(nextData)
    } catch {
      setMessage("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="muse-track-page">
      <style>{trackingStyles}</style>

      <div className="page-wrap">
        <div className="page-eyebrow">After your order</div>
        <h1 className="page-title">Where&apos;s my order?</h1>

        <section className="lookup-panel">
          <h2>Enter your tracking number</h2>
          <p>
            Your tracking number is in your shipping confirmation email - it
            looks something like <strong>EB857148677CN</strong>.
          </p>
          <form className="lookup-form" onSubmit={handleLookup}>
            <div className="form-group">
              <label className="form-label" htmlFor="track-num">
                Tracking number
              </label>
              <input
                className="form-input"
                id="track-num"
                type="text"
                placeholder="e.g. EB857148677CN"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={trackingNumber}
                onChange={(event) =>
                  setTrackingNumber(event.target.value.toUpperCase())
                }
              />
            </div>
            <button
              className="btn-track"
              type="submit"
              disabled={loading}
              aria-label="Track your order"
            >
              {loading ? "Tracking..." : "Track"}
            </button>
          </form>
        </section>

        {hasLookupResult && (
        <section className="tracking-layout" id="tracking-result" aria-live="polite">
          <div>
            {data ? (
              <>
                <div className="eta-card">
                  <div className="eta-inner">
                    <div className="eta-label">
                      <span
                        className={`eta-pulse ${
                          data.stateKey === "delivered" ? "delivered" : ""
                        }`}
                      />
                      <span>{data.labelText}</span>
                    </div>
                    <div className="eta-date">{data.date}</div>
                  </div>
                </div>

                <div className={`status-banner ${data.bannerClass}`}>
                  <div className="status-icon">{data.icon}</div>
                  <div className="status-text-wrap">
                    <div className="status-stage">{data.stage}</div>
                    <div className="status-detail">{data.detail}</div>
                  </div>
                </div>

                {data.showDelay && (
              <div className="delay-callout">
                <div className="delay-callout-icon">!</div>
                <div className="delay-callout-text">
                  <h4>No scan in a while - but that&apos;s pretty normal</h4>
                  <p>
                    International transit sometimes goes quiet for a few days
                    while the parcel moves between hubs. It&apos;s usually
                    still on its way. Give us a shout if you&apos;re worried
                    and we&apos;ll look into it.
                  </p>
                  <a href="mailto:support@musenz.com" className="btn-contact">
                    Get in touch
                  </a>
                </div>
              </div>
                )}

                {data.showLeg && (
              <div className="leg-explainer">
                <div className="leg-icon">NZ</div>
                <div className="leg-text">
                  <h4>Two-leg journey - that&apos;s why it takes 13-16 days</h4>
                  <p>
                    Your order ships from our overseas warehouse to Auckland,
                    then NZ Post delivers to you. That two-leg model is how we
                    keep prices at half retail. The wait is the tradeoff, and
                    it&apos;s worth it.
                  </p>
                </div>
              </div>
                )}

                <div className="timeline-card">
              <div className="timeline-label">Fulfilment timeline</div>
              <div className="timeline">
                {STEPS.map((step, index) => {
                  const isDone = index < data.activeStep || data.activeStep === 5
                  const isActive = index === data.activeStep
                  const className = isDone
                    ? "done"
                    : isActive
                    ? "active"
                    : "pending"

                  return (
                    <div className={`timeline-step ${className}`} key={step.label}>
                      <div className="tl-dot-col">
                        <div className="tl-dot">
                          {isDone ? (
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </div>
                      </div>
                      <div className="tl-content">
                        <div className="tl-stage">
                          {step.label}
                          <span className="tl-tip" data-tip={step.tip}>
                            ?
                          </span>
                        </div>
                        {isDone && <div className="tl-meta done">Done</div>}
                        {isActive && (
                          <div className="tl-meta current">Current stage</div>
                        )}
                        {!isDone && !isActive && (
                          <div className="tl-meta">Coming up</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
                </div>
              </>
            ) : (
              <div className="eta-card lookup-loading-card">
                <div className="eta-inner">
                  <div className="eta-label">
                    <span className="eta-pulse" />
                    <span>{loading ? "Fetching tracking" : "Tracking lookup"}</span>
                  </div>
                  <div className="eta-date">
                    {loading ? "Checking your parcel..." : "No live scans yet"}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`nzpost-card ${nzPostOpen ? "card-open" : ""}`}
              id="nzpost-card"
            >
              <button
                className="collapse-header"
                type="button"
                onClick={() => setNzPostOpen((open) => !open)}
              >
                <span className="collapse-header-label">Track on NZ Post</span>
                <span className="collapse-chevron">⌃</span>
              </button>
              <div className="collapse-body">
                <div className="nzpost-header">
                  <img
                    src="/nzpost/nz-post-logo-horizontal-red.png"
                    alt="NZ Post"
                    height={32}
                  />
                  <div className="nzpost-header-text">
                    <div className="nzpost-header-title">Track on NZ Post</div>
                    <div className="nzpost-header-sub">
                      View, redirect or add delivery instructions
                    </div>
                  </div>
                </div>
                <div className="nzpost-actions">
                  <NzPostButton
                    href={nzPostHref}
                    icon="external"
                    label="View on NZ Post"
                    sub="See live scans on the official NZ Post page"
                  />
                  <NzPostButton
                    href={nzPostHref}
                    icon="edit"
                    label="Delivery Instructions"
                    sub="Leave by door, buzz flat number, safe drop, etc."
                  />
                  <NzPostButton
                    href={nzPostHref}
                    icon="home"
                    label="Redirect Parcel"
                    sub="Change delivery address or send to a Post Shop"
                  />
                </div>
              </div>
            </div>

            <div className="events-card">
              <h3>Tracking events</h3>
              <div>
                {loading ? (
                  <div className="event-message">Looking up your shipment...</div>
                ) : message ? (
                  <div className="event-message">{message}</div>
                ) : data ? (
                  data.events.map((event, index) => (
                    <div className="event" key={`${event.time}-${index}`}>
                      <div className="event-time">{event.time}</div>
                      <div>
                        <div className="event-desc">{event.desc}</div>
                        <div className="event-loc">{event.loc}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="event-message">
                    Enter your tracking number above to fetch the latest scans.
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="sidebar">
            <div
              className={`order-card ${orderOpen ? "card-open" : ""}`}
              id="order-card"
            >
              <button
                className="collapse-header"
                type="button"
                onClick={() => setOrderOpen((open) => !open)}
              >
                <span className="collapse-header-label">Your order</span>
                <span className="collapse-chevron">⌃</span>
              </button>
              <div className="collapse-body">
                <h3>Your lookup</h3>
                <div className="order-ref">{submittedTrackingNumber}</div>
                <div className="order-date">
                  Tracking details are fetched live from the carrier.
                </div>
                {data ? (
                  <div className="lookup-summary">
                    <div>
                      <span>Current stage</span>
                      <strong>{data.stage}</strong>
                    </div>
                    <div>
                      <span>{data.labelText}</span>
                      <strong>{data.date || "Updating"}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="lookup-summary-text">
                    We have registered this number. Refresh the lookup shortly
                    and the order journey will appear here once scans are live.
                  </p>
                )}
              </div>
            </div>

            {data?.showDelivered && (
              <div className="delivered-cta">
                <h3>Landed!</h3>
                <p>
                  Tag <strong>@muse.nz</strong> on Instagram when you wear it
                  and get <strong>10% off your next order.</strong>
                </p>
                <a
                  href="https://instagram.com/muse.nz"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-insta"
                >
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                  @muse.nz
                </a>
              </div>
            )}

            <div className="help-card">
              <div className="help-card-inner">
                <h3>Got a question?</h3>
                <p>
                  Need an update on your order? Just reply to any of our emails
                  or send us a message on Instagram or Facebook. We&apos;ll get
                  back to you as soon as we can.
                </p>
                <a href="mailto:support@musenz.com" className="btn-yellow">
                  Email us
                </a>
              </div>
            </div>
          </aside>
        </section>
        )}
      </div>
    </main>
  )
}

function NzPostButton({
  href,
  icon,
  label,
  sub,
}: {
  href: string
  icon: "external" | "edit" | "home"
  label: string
  sub: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="nzpost-btn">
      {icon === "external" && (
        <svg viewBox="0 0 24 24">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      )}
      {icon === "edit" && (
        <svg viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )}
      {icon === "home" && (
        <svg viewBox="0 0 24 24">
          <path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )}
      <div className="nzpost-btn-label">
        {label}
        <div className="nzpost-btn-sub">{sub}</div>
      </div>
      <span className="nzpost-btn-arrow">›</span>
    </a>
  )
}

const trackingStyles = `
.muse-track-page {
  --black: #0A0A0A;
  --cream: #F4F2ED;
  --cream-warm: #F8F7F4;
  --cream-deep: #ECE9E2;
  --yellow: #C8D050;
  --yellow-deep: #B6C043;
  --orange: #C1440E;
  --orange-soft: #FDF4EF;
  --green: #1F7A3A;
  --green-soft: #EBF5EE;
  --blue-soft: #EDF2FB;
  --nzpost: #D41F26;
  --text: #1A1A1A;
  --text-muted: #666;
  --text-light: #999;
  --border: #E8E6E0;
  background: var(--cream);
  color: var(--text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.muse-track-page * { box-sizing: border-box; }
.muse-track-page img { max-width: 100%; display: block; }
.muse-track-page a { color: inherit; text-decoration: none; }
.muse-track-page button { font-family: inherit; cursor: pointer; border: 0; background: none; }
.page-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 52px 32px 96px;
}
.page-eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--text-light);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.page-eyebrow::before {
  content: "";
  display: inline-block;
  width: 24px;
  height: 1px;
  background: var(--text-light);
}
.page-title {
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 900;
  letter-spacing: -0.035em;
  line-height: 1;
  color: var(--black);
  margin-bottom: 36px;
}
.lookup-panel {
  background: var(--cream-warm);
  border-radius: 24px;
  padding: 36px 40px;
  margin-bottom: 40px;
  border: 1px solid var(--border);
}
.lookup-panel h2 {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 5px;
}
.lookup-panel p {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
  line-height: 1.55;
}
.lookup-form {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.form-group {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}
.form-input {
  background: var(--cream);
  border: 1.5px solid var(--border);
  color: var(--text);
  padding: 14px 18px;
  border-radius: 14px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color .15s;
  font-weight: 500;
}
.form-input::placeholder { color: var(--text-light); font-weight: 400; }
.form-input:focus { border-color: var(--black); }
.muse-track-page .btn-track {
  background: var(--yellow);
  color: var(--black);
  min-width: 132px;
  min-height: 50px;
  box-shadow: 0 10px 22px rgba(10,10,10,0.12);
  border: 1.5px solid rgba(10,10,10,0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 15px 28px;
  border-radius: 100px;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: background .15s, transform .15s, box-shadow .15s;
  white-space: nowrap;
}
.muse-track-page .btn-track:hover {
  background: var(--yellow-deep);
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(10,10,10,0.16);
}
.muse-track-page .btn-track:disabled { opacity: .6; cursor: wait; }
.tracking-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}
.eta-card {
  background: var(--black);
  border-radius: 24px;
  padding: 40px 44px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
  min-height: 168px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.eta-card::before {
  content: "";
  position: absolute;
  top: -40%;
  right: -8%;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(200,208,80,0.06), transparent 65%);
  pointer-events: none;
}
.eta-inner { position: relative; z-index: 2; }
.eta-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--yellow);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.eta-pulse {
  width: 8px;
  height: 8px;
  background: var(--yellow);
  border-radius: 50%;
  animation: trackPulse 2s infinite;
  flex-shrink: 0;
}
.eta-pulse.delivered { background: var(--green); }
@keyframes trackPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .35; transform: scale(.7); }
}
.eta-date {
  font-size: clamp(26px, 3.5vw, 38px);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--cream);
}
.lookup-loading-card { min-height: 144px; }
.status-banner {
  border-radius: 18px;
  padding: 20px 24px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.status-banner.intransit { background: var(--blue-soft); }
.status-banner.arrived { background: var(--green-soft); }
.status-banner.outfordelivery { background: var(--orange-soft); }
.status-banner.delivered { background: var(--green-soft); }
.status-banner.processing { background: var(--cream-deep); }
.status-banner.placed { background: var(--cream-deep); }
.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.status-banner.intransit .status-icon { background: rgba(59,130,246,0.12); }
.status-banner.arrived .status-icon { background: rgba(31,122,58,0.12); }
.status-banner.outfordelivery .status-icon { background: rgba(193,68,14,0.12); }
.status-banner.delivered .status-icon { background: rgba(31,122,58,0.12); }
.status-banner.processing .status-icon { background: rgba(0,0,0,0.06); }
.status-banner.placed .status-icon { background: rgba(0,0,0,0.06); }
.status-text-wrap { flex: 1; padding-top: 2px; }
.status-stage {
  font-size: 16px;
  font-weight: 800;
  color: var(--black);
  margin-bottom: 5px;
  letter-spacing: -0.01em;
}
.status-detail { font-size: 14px; color: var(--text-muted); line-height: 1.55; }
.timeline-card {
  background: var(--cream-warm);
  border-radius: 24px;
  padding: 32px 36px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.timeline-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-light);
  margin-bottom: 32px;
}
.timeline { display: flex; flex-direction: column; }
.timeline-step {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 18px;
  position: relative;
}
.timeline-step:not(:last-child) .tl-dot-col::after {
  content: "";
  position: absolute;
  left: 21px;
  top: 44px;
  bottom: -10px;
  width: 2px;
  background: var(--border);
  z-index: 0;
}
.timeline-step.done:not(:last-child) .tl-dot-col::after { background: var(--black); }
.timeline-step.active:not(:last-child) .tl-dot-col::after {
  background: linear-gradient(to bottom, var(--black) 30%, var(--border));
}
.tl-dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding-top: 5px;
}
.tl-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
  transition: all .2s;
}
.timeline-step.done .tl-dot { background: var(--black); color: var(--cream); }
.timeline-step.active .tl-dot {
  background: var(--yellow);
  color: var(--black);
  box-shadow: 0 0 0 6px rgba(200,208,80,0.18);
}
.timeline-step.pending .tl-dot {
  background: var(--cream-deep);
  color: var(--text-light);
  border: 2px solid var(--border);
}
.tl-content { padding-bottom: 32px; }
.timeline-step:last-child .tl-content { padding-bottom: 0; }
.tl-stage {
  font-size: 15px;
  font-weight: 700;
  color: var(--black);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 5px;
}
.timeline-step.pending .tl-stage {
  color: var(--text-light);
  font-weight: 600;
}
.tl-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 800;
  cursor: default;
  position: relative;
}
.tl-tip:hover::after {
  content: attr(data-tip);
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--black);
  color: var(--cream);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.55;
  padding: 12px 16px;
  border-radius: 14px;
  width: 220px;
  white-space: normal;
  z-index: 20;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  pointer-events: none;
}
.tl-meta { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
.tl-meta.done { color: var(--green); font-weight: 600; }
.tl-meta.current { font-weight: 700; color: var(--black); }
.leg-explainer {
  background: var(--orange-soft);
  border-radius: 18px;
  padding: 20px 24px;
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.leg-icon {
  width: 44px;
  height: 44px;
  background: var(--orange);
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.leg-text h4 { font-size: 14px; font-weight: 800; margin-bottom: 5px; color: var(--black); }
.leg-text p { font-size: 13.5px; color: var(--text-muted); line-height: 1.6; }
.delay-callout {
  background: #FFFBEA;
  border: 1.5px solid #F0D040;
  border-radius: 18px;
  padding: 20px 24px;
  margin-bottom: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.delay-callout-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.delay-callout-text h4 { font-size: 14px; font-weight: 800; margin-bottom: 5px; color: #6B5000; }
.delay-callout-text p { font-size: 13.5px; color: #7A6000; line-height: 1.6; margin-bottom: 12px; }
.btn-contact {
  font-size: 12px;
  font-weight: 700;
  color: var(--black);
  border: 1.5px solid var(--black);
  padding: 9px 18px;
  border-radius: 100px;
  display: inline-block;
  transition: all .15s;
}
.btn-contact:hover { background: var(--black); color: var(--cream); }
.nzpost-card {
  background: var(--cream-warm);
  border-radius: 24px;
  padding: 28px 32px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.nzpost-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.nzpost-header img { display: block; object-fit: contain; flex-shrink: 0; height: 32px; width: auto; }
.nzpost-header-text { flex: 1; }
.nzpost-header-title { font-size: 14px; font-weight: 800; color: var(--black); }
.nzpost-header-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.nzpost-actions { display: flex; flex-direction: column; gap: 8px; }
.nzpost-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--cream);
  border-radius: 14px;
  border: 1.5px solid var(--border);
  font-size: 14px;
  font-weight: 600;
  color: var(--black);
  transition: all .15s;
}
.nzpost-btn:hover { border-color: var(--nzpost); }
.nzpost-btn svg {
  width: 18px;
  height: 18px;
  stroke: var(--text-muted);
  flex-shrink: 0;
  fill: none;
  stroke-width: 2;
  transition: stroke .15s;
}
.nzpost-btn:hover svg { stroke: var(--nzpost); }
.nzpost-btn-label { flex: 1; }
.nzpost-btn-sub { font-size: 12px; color: var(--text-light); font-weight: 400; margin-top: 2px; }
.nzpost-btn-arrow { color: var(--text-light); font-size: 18px; }
.events-card {
  background: var(--cream-warm);
  border-radius: 24px;
  padding: 28px 32px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.events-card h3 {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-light);
  margin-bottom: 20px;
}
.event {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  align-items: start;
}
.event:last-child { border-bottom: 0; padding-bottom: 0; }
.event-time { font-size: 12px; color: var(--text-light); font-weight: 500; padding-top: 2px; line-height: 1.55; }
.event-desc { font-size: 14px; color: var(--text); font-weight: 500; }
.event-loc { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
.event-message { padding: 14px 0; color: var(--text-muted); font-size: 14px; }
.sidebar { display: flex; flex-direction: column; gap: 16px; }
.order-card {
  background: var(--cream-warm);
  border-radius: 24px;
  padding: 28px;
  border: 1px solid var(--border);
}
.order-card h3 {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-light);
  margin-bottom: 16px;
}
.order-ref { font-size: 20px; font-weight: 900; letter-spacing: -0.02em; color: var(--black); margin-bottom: 3px; }
.order-date { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
.lookup-summary {
  display: grid;
  gap: 10px;
}
.lookup-summary div {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--cream);
  padding: 14px;
}
.lookup-summary span,
.lookup-summary-text {
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.55;
}
.lookup-summary span {
  display: block;
  margin-bottom: 4px;
}
.lookup-summary strong {
  display: block;
  color: var(--black);
  font-size: 14px;
  line-height: 1.35;
}
.order-item {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 0;
  border-top: 1px solid var(--border);
}
.order-item-img {
  width: 60px;
  height: 60px;
  border-radius: 13px;
  background: linear-gradient(135deg, var(--cream-deep), var(--cream-warm));
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 11px;
  color: rgba(0,0,0,0.1);
  letter-spacing: -0.04em;
}
.order-item-info { flex: 1; }
.order-item-name { font-size: 13.5px; font-weight: 700; color: var(--black); line-height: 1.3; margin-bottom: 3px; }
.order-item-meta { font-size: 12px; color: var(--text-muted); }
.order-item-price { font-size: 15px; font-weight: 800; color: var(--black); }
.address-card {
  background: var(--cream-warm);
  border-radius: 20px;
  padding: 22px 24px;
  border: 1px solid var(--border);
}
.address-card h3 {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-light);
  margin-bottom: 12px;
}
.address-lines { font-size: 14px; color: var(--text); line-height: 1.7; }
.address-lines strong { font-weight: 700; }
.delivered-cta {
  background: var(--green-soft);
  border-radius: 20px;
  padding: 24px;
  border: 1.5px solid rgba(31,122,58,0.2);
}
.delivered-cta h3 { font-size: 15px; font-weight: 800; color: var(--green); margin-bottom: 6px; }
.delivered-cta p { font-size: 13.5px; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px; }
.btn-insta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--black);
  color: var(--cream);
  padding: 12px 20px;
  border-radius: 100px;
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.03em;
  transition: background .15s;
}
.btn-insta:hover { background: #333; }
.btn-insta svg { width: 14px; height: 14px; stroke: var(--cream); fill: none; stroke-width: 2; }
.help-card {
  background: var(--black);
  border-radius: 20px;
  padding: 26px 28px;
  color: var(--cream);
  position: relative;
  overflow: hidden;
}
.help-card::before {
  content: "";
  position: absolute;
  bottom: -30%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(193,68,14,0.18), transparent 60%);
  pointer-events: none;
}
.help-card-inner { position: relative; z-index: 2; }
.help-card h3 { font-size: 15px; font-weight: 800; margin-bottom: 7px; letter-spacing: -0.01em; }
.help-card p { font-size: 13px; color: #aaa; line-height: 1.65; margin-bottom: 18px; }
.btn-yellow {
  background: var(--yellow);
  color: var(--black);
  padding: 13px 24px;
  border-radius: 100px;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: inline-block;
  transition: background .15s, transform .15s;
}
.btn-yellow:hover { background: var(--yellow-deep); transform: translateY(-1px); }
.collapse-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  width: 100%;
  padding: 0;
}
.collapse-header-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-light);
}
.collapse-chevron {
  color: var(--text-light);
  font-size: 20px;
  line-height: 1;
  transition: transform .2s;
  display: inline-block;
  transform: rotate(0deg);
}
.card-open .collapse-chevron { transform: rotate(180deg); }
@media (max-width: 960px) {
  .tracking-layout { grid-template-columns: 1fr; }
  .sidebar { order: 2; }
}
@media (max-width: 768px) {
  .page-wrap { padding: 32px 16px 80px; }
  .lookup-panel { padding: 24px 20px; }
  .lookup-form { flex-direction: column; gap: 10px; align-items: stretch; }
  .page-title { margin-bottom: 28px; }
  .btn-track { width: 100%; text-align: center; }
  .eta-card { padding: 36px 28px; min-height: 150px; }
  .eta-date { font-size: 30px; }
  .status-banner { padding: 22px 20px; gap: 14px; }
  .status-icon { width: 52px; height: 52px; font-size: 24px; }
  .status-stage { font-size: 17px; }
  .status-detail { font-size: 14px; }
  .leg-explainer { padding: 20px; gap: 14px; }
  .leg-text h4 { font-size: 15px; }
  .leg-text p { font-size: 14px; }
  .delay-callout { padding: 20px; }
  .delay-callout-text h4 { font-size: 14px; }
  .delay-callout-text p { font-size: 14px; }
  .collapse-header { display: flex; }
  .timeline-card { padding: 28px 22px; }
  .events-card { padding: 24px 20px; }
  .tl-stage { font-size: 15px; }
  .tl-content { padding-bottom: 24px; }
  #nzpost-card > .collapse-body,
  #order-card > .collapse-body { display: none; }
  #nzpost-card.card-open > .collapse-body,
  #order-card.card-open > .collapse-body { display: block; }
  .nzpost-card { padding: 24px 20px; }
  .nzpost-card .collapse-header,
  .order-card .collapse-header { margin-bottom: 0; }
  .nzpost-card.card-open .collapse-header,
  .order-card.card-open .collapse-header { margin-bottom: 20px; }
  .nzpost-btn { padding: 16px 14px; font-size: 14px; }
  .event { grid-template-columns: 100px 1fr; gap: 10px; }
  .event-desc { font-size: 14px; }
  .order-card { display: block; padding: 24px 20px; }
  .address-card { display: block; padding: 22px 20px; }
  .help-card { padding: 28px 24px; }
  .help-card h3 { font-size: 17px; }
  .help-card p { font-size: 14px; }
}
`
