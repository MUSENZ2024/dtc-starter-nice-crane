import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { aucklandDateKey, numberValue, reportingRange } from "../../../../lib/marketing-reporting"

type OrderItem = {
  quantity: number
  unit_price: number
  total: number
  product_title?: string | null
  title?: string | null
}

type Order = {
  id: string
  created_at: string
  total: number
  status: string
  items?: OrderItem[] | null
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const range = reportingRange(
      typeof req.query.from === "string" ? req.query.from : undefined,
      typeof req.query.to === "string" ? req.query.to : undefined
    )
    const query = req.scope.resolve("query")

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "created_at",
        "total",
        "status",
        "items.quantity",
        "items.unit_price",
        "items.total",
        "items.product_title",
        "items.title",
      ],
      filters: {
        created_at: { $gte: range.start, $lte: range.end },
        status: { $ne: "canceled" },
      },
      pagination: { take: 10_000, order: { created_at: "DESC" } },
    })

    const rows = orders as Order[]
    const revenue = rows.reduce((sum, order) => sum + numberValue(order.total), 0)
    const orderCount = rows.length
    const unitsSold = rows.reduce(
      (sum, order) => sum + (order.items || []).reduce((s, item) => s + numberValue(item.quantity), 0),
      0
    )
    const aov = orderCount > 0 ? revenue / orderCount : 0

    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    for (const order of rows) {
      const key = aucklandDateKey(order.created_at)
      const bucket = dailyMap.get(key) || { revenue: 0, orders: 0 }
      bucket.revenue += numberValue(order.total)
      bucket.orders += 1
      dailyMap.set(key, bucket)
    }
    const daily = Array.from(dailyMap.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const productMap = new Map<string, { title: string; revenue: number; quantity: number }>()
    for (const order of rows) {
      for (const item of order.items || []) {
        const title = item.product_title || item.title || "Unknown"
        const bucket = productMap.get(title) || { title, revenue: 0, quantity: 0 }
        bucket.revenue += numberValue(item.total)
        bucket.quantity += numberValue(item.quantity)
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
