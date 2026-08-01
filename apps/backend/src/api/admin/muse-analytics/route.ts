import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { numberValue, reportingRange } from "../../../lib/marketing-reporting"
import { getTrafficAnalytics } from "../../../lib/google-analytics"

type Ranked = { label: string; revenue: number; quantity: number }
const add = (map: Map<string, Ranked>, label: unknown, revenue: number, quantity: number) => {
  const key = typeof label === "string" && label.trim() ? label.trim() : "Unknown"
  const row = map.get(key) || { label: key, revenue: 0, quantity: 0 }
  row.revenue += revenue; row.quantity += quantity; map.set(key, row)
}
const top = (map: Map<string, Ranked>) => [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10)

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const range = reportingRange(typeof req.query.from === "string" ? req.query.from : undefined, typeof req.query.to === "string" ? req.query.to : undefined)
    const query = req.scope.resolve("query")
    const { data: orders } = await query.graph({ entity: "order", fields: ["id", "created_at", "total", "discount_total", "status", "summary"], filters: { created_at: { $gte: range.start, $lte: range.end }, status: { $ne: "canceled" } } })
    const rows = orders as any[]
    const revenue = rows.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    const discountTotal = rows.reduce((sum, order) => sum + (Number(order.discount_total) || 0), 0)
    const ids = rows.map((order) => order.id)
    const { data: details } = ids.length ? await query.graph({ entity: "order", fields: ["id", "shipping_address.city", "shipping_address.province", "shipping_address.country_code", "items.detail.quantity", "items.unit_price", "items.product_title", "items.variant_title", "items.metadata", "items.adjustments.code", "items.adjustments.amount"], filters: { id: ids }, pagination: { take: ids.length } }) : { data: [] }
    const products = new Map<string, Ranked>(), brands = new Map<string, Ranked>(), colours = new Map<string, Ranked>(), sizes = new Map<string, Ranked>(), regions = new Map<string, Ranked>(), discounts = new Map<string, Ranked>()
    let units = 0
    for (const order of details as any[]) {
      const address = order.shipping_address || {}; add(regions, address.province || address.city || address.country_code, Number(rows.find((r) => r.id === order.id)?.total) || 0, 1)
      for (const item of order.items || []) {
        const quantity = numberValue(item.detail?.quantity); const lineRevenue = quantity * numberValue(item.unit_price); units += quantity
        const meta = item.metadata || {}; add(products, item.product_title || item.title, lineRevenue, quantity)
        add(brands, meta.brand || meta.Brand || "Unspecified", lineRevenue, quantity)
        add(colours, meta.colour || meta.color || meta.Colour || meta.Color || "Unspecified", lineRevenue, quantity)
        add(sizes, meta.size || meta.Size || item.variant_title || "Unspecified", lineRevenue, quantity)
        for (const adjustment of item.adjustments || []) add(discounts, adjustment.code || "Automatic discount", numberValue(adjustment.amount), 1)
      }
    }
    const traffic = await getTrafficAnalytics(range.from, range.to)
    res.json({ range: { from: range.from, to: range.to, time_zone: range.time_zone }, sales: { kpis: { revenue, orders: rows.length, units_sold: units, aov: rows.length ? revenue / rows.length : 0, discounts: discountTotal }, products: top(products), brands: top(brands), colours: top(colours), sizes: top(sizes), discounts: top(discounts), regions: top(regions) }, traffic })
  } catch (error) {
    req.scope.resolve("logger").error(`[muse-analytics] ${error instanceof Error ? error.stack || error.message : String(error)}`)
    res.status(400).json({ message: error instanceof Error ? error.message : "Analytics could not be loaded." })
  }
}
