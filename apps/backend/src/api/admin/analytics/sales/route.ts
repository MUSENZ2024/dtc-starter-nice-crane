import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { aucklandDateKey, numberValue, reportingRange } from "../../../../lib/marketing-reporting"

type Order = {
  id: string
  created_at: string
  total: number
  status: string
}

type OrderItems = {
  id: string
  items?:
    | { unit_price: number; product_title?: string | null; title?: string | null; detail?: { quantity: number } }[]
    | null
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const range = reportingRange(
      typeof req.query.from === "string" ? req.query.from : undefined,
      typeof req.query.to === "string" ? req.query.to : undefined
    )
    const query = req.scope.resolve("query")

    // Requesting order.total without also requesting "summary" makes the order
    // module recompute totals from scratch by eagerly hydrating item/shipping
    // adjustments, which throws ("Shipping method version is required to load
    // adjustments"). Requesting "summary" instead uses the already materialized
    // order_summary total. That combination breaks again specifically when a
    // "take" pagination limit is also passed (forces a different load strategy),
    // so this query is left unpaginated and relies on the date-range filter to
    // keep the result set bounded.
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "created_at", "total", "status", "summary"],
      filters: {
        created_at: { $gte: range.start, $lte: range.end },
        status: { $ne: "canceled" },
      },
    })

    // order.total comes back as a Medusa BigNumber instance (not a plain number
    // or a {value} object), so numberValue() (built for raw DB columns) misses
    // it and would silently produce 0. Number() works because BigNumber defines
    // valueOf().
    const orderTotal = (order: Order) => Number(order.total) || 0

    const rows = orders as Order[]
    const revenue = rows.reduce((sum, order) => sum + orderTotal(order), 0)
    const orderCount = rows.length
    const aov = orderCount > 0 ? revenue / orderCount : 0

    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    for (const order of rows) {
      const key = aucklandDateKey(order.created_at)
      const bucket = dailyMap.get(key) || { revenue: 0, orders: 0 }
      bucket.revenue += orderTotal(order)
      bucket.orders += 1
      dailyMap.set(key, bucket)
    }
    const daily = Array.from(dailyMap.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const orderIds = rows.map((order) => order.id)
    const { data: orderItems } = orderIds.length
      ? await query.graph({
          entity: "order",
          fields: ["id", "items.detail.quantity", "items.unit_price", "items.product_title", "items.title"],
          filters: { id: orderIds },
          pagination: { take: orderIds.length },
        })
      : { data: [] as OrderItems[] }

    let unitsSold = 0
    const productMap = new Map<string, { title: string; revenue: number; quantity: number }>()
    for (const order of orderItems as OrderItems[]) {
      for (const item of order.items || []) {
        const quantity = numberValue(item.detail?.quantity)
        const lineRevenue = quantity * numberValue(item.unit_price)
        unitsSold += quantity
        const title = item.product_title || item.title || "Unknown"
        const bucket = productMap.get(title) || { title, revenue: 0, quantity: 0 }
        bucket.revenue += lineRevenue
        bucket.quantity += quantity
        productMap.set(title, bucket)
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    res.status(200).json({
      range: { from: range.from, to: range.to, time_zone: range.time_zone },
      kpis: { revenue, orders: orderCount, units_sold: unitsSold, aov },
      daily,
      top_products: topProducts,
    })
  } catch (error) {
    req.scope.resolve("logger").error(
      `[analytics/sales] ${error instanceof Error ? error.stack || error.message : String(error)}`
    )
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid reporting range" })
  }
}
