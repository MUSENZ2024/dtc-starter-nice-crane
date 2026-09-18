import { BetaAnalyticsDataClient } from "@google-analytics/data"

type RankedRow = { label: string; visits: number }

const clean = (value?: string | null) => value && value !== "(not set)" ? value : "Unknown"

export async function getTrafficAnalytics(from: string, to: string) {
  const propertyId = process.env.GA4_PROPERTY_ID
  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!propertyId || !clientEmail || !privateKey) {
    return { configured: false, message: "Google Analytics credentials are not fully configured." }
  }

  const client = new BetaAnalyticsDataClient({ credentials: { client_email: clientEmail, private_key: privateKey } })
  const property = `properties/${propertyId}`
  const dateRanges = [{ startDate: from, endDate: to }]
  const ranked = async (dimension: string, metric = "sessions", limit = 10): Promise<RankedRow[]> => {
    const [report] = await client.runReport({ property, dateRanges, dimensions: [{ name: dimension }], metrics: [{ name: metric }], limit })
    return (report.rows || []).map((row) => ({ label: clean(row.dimensionValues?.[0]?.value), visits: Number(row.metricValues?.[0]?.value || 0) })).filter((row) => row.label !== "Unknown")
  }

  try {
    const [[summary], sources, geography, devices, browsers, operatingSystems, campaignKeywords, searches] = await Promise.all([
      client.runReport({ property, dateRanges, metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }] }),
      ranked("sessionSourceMedium"), ranked("country"), ranked("deviceCategory"), ranked("browser"), ranked("operatingSystem"),
      ranked("sessionManualTerm"), ranked("searchTerm", "eventCount"),
    ])
    const values = summary.rows?.[0]?.metricValues || []
    return {
      configured: true,
      kpis: { visits: Number(values[0]?.value || 0), users: Number(values[1]?.value || 0), page_views: Number(values[2]?.value || 0) },
      sources, geography, devices, browsers, operating_systems: operatingSystems, campaign_keywords: campaignKeywords, searches,
    }
  } catch (error) {
    return { configured: true, message: error instanceof Error ? error.message : "Google Analytics reporting failed." }
  }
}

export type DailyTrafficRow = { date: string; sessions: number; add_to_carts: number; checkouts: number; purchases: number }

export async function getDailyTraffic(from: string, to: string): Promise<{ configured: boolean; message?: string; rows: DailyTrafficRow[] }> {
  const propertyId = process.env.GA4_PROPERTY_ID
  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!propertyId || !clientEmail || !privateKey) {
    return { configured: false, message: "Google Analytics credentials are not fully configured.", rows: [] }
  }

  const client = new BetaAnalyticsDataClient({ credentials: { client_email: clientEmail, private_key: privateKey } })
  try {
    const [report] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "addToCarts" }, { name: "checkouts" }, { name: "ecommercePurchases" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    })
    const rows = (report.rows || []).map((row) => {
      const raw = row.dimensionValues?.[0]?.value || ""
      const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw
      const [sessions, addToCarts, checkouts, purchases] = row.metricValues || []
      return { date, sessions: Number(sessions?.value || 0), add_to_carts: Number(addToCarts?.value || 0), checkouts: Number(checkouts?.value || 0), purchases: Number(purchases?.value || 0) }
    })
    return { configured: true, rows }
  } catch (error) {
    return { configured: true, message: error instanceof Error ? error.message : "Google Analytics reporting failed.", rows: [] }
  }
}
