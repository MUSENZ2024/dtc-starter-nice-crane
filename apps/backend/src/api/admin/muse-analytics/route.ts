import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { aucklandDateKey, numberValue, reportingRange } from "../../../lib/marketing-reporting"
import { getTrafficAnalytics, getDailyTraffic } from "../../../lib/google-analytics"

type Ranked = { label: string; revenue: number; quantity: number }
const add = (map: Map<string, Ranked>, label: unknown, revenue: number, quantity: number) => {
  const key = typeof label === "string" && label.trim() ? label.trim() : "Unknown"
  const row = map.get(key) || { label: key, revenue: 0, quantity: 0 }
  row.revenue += revenue; row.quantity += quantity; map.set(key, row)
}
const top = (map: Map<string, Ranked>) => [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10)

type Range = ReturnType<typeof reportingRange>

async function aggregateSales(query: any, range: Range) {
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "created_at", "total", "subtotal", "discount_total", "shipping_total", "tax_total", "status", "customer_id", "email", "summary"],
    filters: { created_at: { $gte: range.start, $lte: range.end }, status: { $ne: "canceled" } },
  })
  const rows = orders as any[]
  const revenue = rows.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
  const grossTotal = rows.reduce((sum, order) => sum + (Number(order.subtotal) || 0), 0)
  const discountTotal = rows.reduce((sum, order) => sum + (Number(order.discount_total) || 0), 0)
  const shippingTotal = rows.reduce((sum, order) => sum + (Number(order.shipping_total) || 0), 0)
  const taxTotal = rows.reduce((sum, order) => sum + (Number(order.tax_total) || 0), 0)
  const refundTotal = rows.reduce((sum, order) => sum + numberValue(order.summary?.refunded_total), 0)
  const ids = rows.map((order) => order.id)
  const { data: details } = ids.length ? await query.graph({
    entity: "order",
    fields: ["id", "shipping_address.city", "shipping_address.province", "shipping_address.country_code", "items.detail.quantity", "items.unit_price", "items.product_title", "items.variant_title", "items.metadata", "items.adjustments.code", "items.adjustments.amount"],
    filters: { id: ids },
    pagination: { take: ids.length },
  }) : { data: [] }

  const products = new Map<string, Ranked>(), brands = new Map<string, Ranked>(), colours = new Map<string, Ranked>(), sizes = new Map<string, Ranked>(), regions = new Map<string, Ranked>(), discounts = new Map<string, Ranked>()
  let units = 0
  for (const order of details as any[]) {
    const address = order.shipping_address || {}
    add(regions, address.province || address.city || address.country_code, Number(rows.find((r) => r.id === order.id)?.total) || 0, 1)
    for (const item of order.items || []) {
      const quantity = numberValue(item.detail?.quantity); const lineRevenue = quantity * numberValue(item.unit_price); units += quantity
      const meta = item.metadata || {}
      add(products, item.product_title || item.title, lineRevenue, quantity)
      add(brands, meta.brand || meta.Brand || "Unspecified", lineRevenue, quantity)
      add(colours, meta.colour || meta.color || meta.Colour || meta.Color || "Unspecified", lineRevenue, quantity)
      add(sizes, meta.size || meta.Size || item.variant_title || "Unspecified", lineRevenue, quantity)
      for (const adjustment of item.adjustments || []) add(discounts, adjustment.code || "Automatic discount", numberValue(adjustment.amount), 1)
    }
  }

  const dayMap = new Map<string, { date: string; revenue: number; orders: number }>()
  for (const order of rows) {
    const key = aucklandDateKey(order.created_at)
    const bucket = dayMap.get(key) || { date: key, revenue: 0, orders: 0 }
    bucket.revenue += Number(order.total) || 0
    bucket.orders += 1
    dayMap.set(key, bucket)
  }
  const time_series = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date))

  const customerIds = [...new Set(rows.map((order) => order.customer_id).filter(Boolean))]
  let newCustomers = 0, returningCustomers = 0
  if (customerIds.length) {
    const { data: customers } = await query.graph({ entity: "customer", fields: ["id", "created_at"], filters: { id: customerIds } })
    const createdMap = new Map((customers as any[]).map((c) => [c.id, c.created_at]))
    for (const id of customerIds) {
      const createdAt = createdMap.get(id)
      if (createdAt && new Date(createdAt) >= range.start) newCustomers++
      else returningCustomers++
    }
  }

  return {
    kpis: {
      revenue, gross_sales: grossTotal, net_sales: grossTotal - discountTotal - refundTotal,
      shipping: shippingTotal, taxes: taxTotal, total_sales: revenue,
      orders: rows.length, units_sold: units,
      aov: rows.length ? revenue / rows.length : 0,
      discounts: discountTotal, refunds: refundTotal,
      refund_rate: revenue ? refundTotal / revenue : 0,
      new_customers: newCustomers, returning_customers: returningCustomers,
      returning_customer_rate: customerIds.length ? returningCustomers / customerIds.length : 0,
    },
    products: top(products), brands: top(brands), colours: top(colours), sizes: top(sizes), discounts: top(discounts), regions: top(regions),
    time_series,
  }
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const q = req.query
    const range = reportingRange(typeof q.from === "string" ? q.from : undefined, typeof q.to === "string" ? q.to : undefined)
    const query = req.scope.resolve("query")

    const current = await aggregateSales(query, range)

    let previous: Awaited<ReturnType<typeof aggregateSales>> | null = null
    let trafficPrevious: Awaited<ReturnType<typeof getTrafficAnalytics>> | null = null
    if (q.compare !== "none") {
      let compareRange: Range
      if (typeof q.compareFrom === "string" && typeof q.compareTo === "string") {
        compareRange = reportingRange(q.compareFrom, q.compareTo)
      } else {
        const lengthMs = range.end.getTime() - range.start.getTime()
        const prevEnd = new Date(range.start.getTime() - 1)
        const prevStart = new Date(prevEnd.getTime() - lengthMs)
        compareRange = reportingRange(aucklandDateKey(prevStart), aucklandDateKey(prevEnd))
      }
      previous = await aggregateSales(query, compareRange)
      trafficPrevious = await getTrafficAnalytics(compareRange.from, compareRange.to)
    }

    const traffic = await getTrafficAnalytics(range.from, range.to)
    const dailyTraffic = await getDailyTraffic(range.from, range.to)

    res.json({
      range: { from: range.from, to: range.to, time_zone: range.time_zone },
      sales: current,
      sales_previous: previous,
      traffic: { ...traffic, daily: dailyTraffic.rows, daily_configured: dailyTraffic.configured },
      traffic_previous: trafficPrevious,
    })
  } catch (error) {
    req.scope.resolve("logger").error(`[muse-analytics] ${error instanceof Error ? error.stack || error.message : String(error)}`)
    res.status(400).json({ message: error instanceof Error ? error.message : "Analytics could not be loaded." })
  }
}
