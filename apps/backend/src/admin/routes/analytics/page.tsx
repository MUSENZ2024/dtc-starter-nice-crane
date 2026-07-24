import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Container, Heading, Input, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type SalesReport = {
  range: { from: string; to: string; time_zone: string }
  kpis: { revenue: number; orders: number; units_sold: number; aov: number }
  daily: { date: string; revenue: number; orders: number }[]
  top_products: { title: string; revenue: number; quantity: number }[]
}

const money = (value: number) =>
  new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(value || 0)
const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
const defaultFrom = () => {
  const date = new Date()
  date.setDate(date.getDate() - 29)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
}

const RevenueChart = ({ daily }: { daily: SalesReport["daily"] }) => {
  if (!daily.length) {
    return <Text size="small" className="text-ui-fg-subtle">No orders in this range.</Text>
  }
  const width = 800
  const height = 220
  const padding = 24
  const max = Math.max(...daily.map((d) => d.revenue), 1)
  const stepX = daily.length > 1 ? (width - padding * 2) / (daily.length - 1) : 0
  const coords = daily.map((d, i) => {
    const x = padding + i * stepX
    const y = height - padding - (d.revenue / max) * (height - padding * 2)
    return { x, y, d }
  })
  const points = coords.map((c) => `${c.x},${c.y}`).join(" ")
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-ui-fg-interactive" style={{ height }}>
      <polyline fill="none" stroke="currentColor" strokeWidth={2} points={points} />
      {coords.map((c) => (
        <circle key={c.d.date} cx={c.x} cy={c.y} r={3} fill="currentColor" />
      ))}
    </svg>
  )
}

const AnalyticsDashboard = () => {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(today)
  const { data, isLoading, isError } = useQuery<SalesReport>({
    queryKey: ["analytics-sales", from, to],
    queryFn: () => sdk.client.fetch(`/admin/analytics/sales?from=${from}&to=${to}`),
  })

  const cards = data
    ? [
        ["Revenue", money(data.kpis.revenue)],
        ["Orders", data.kpis.orders],
        ["Units sold", data.kpis.units_sold],
        ["Average order value", money(data.kpis.aov)],
      ]
    : []

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <div className="flex flex-col gap-4 px-6 py-4">
          <div>
            <Heading>Analytics</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              NZD reporting in Pacific/Auckland. Excludes canceled orders.
            </Text>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <label>
              <Text size="xsmall">From</Text>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label>
              <Text size="xsmall">To</Text>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          {isLoading ? (
            <Text size="small" className="text-ui-fg-subtle">Loading…</Text>
          ) : isError || !data ? (
            <Text size="small" className="text-ui-fg-error">Analytics could not be loaded.</Text>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {cards.map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <Text size="xsmall" className="text-ui-fg-subtle">{label}</Text>
                  <Heading level="h2">{value}</Heading>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      {data && (
        <Container>
          <div className="p-6">
            <Heading level="h2">Revenue</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {data.range.from} – {data.range.to}
            </Text>
            <div className="mt-4">
              <RevenueChart daily={data.daily} />
            </div>
          </div>
        </Container>
      )}

      {data && (
        <Container>
          <div className="p-6">
            <Heading level="h2">Top products by revenue</Heading>
            <div className="mt-4 flex flex-col gap-2">
              {data.top_products.length === 0 ? (
                <Text size="small" className="text-ui-fg-subtle">No product sales in this range.</Text>
              ) : (
                data.top_products.map((product) => {
                  const max = data.top_products[0].revenue || 1
                  const pct = Math.max(4, (product.revenue / max) * 100)
                  return (
                    <div key={product.title} className="flex items-center gap-3">
                      <Text size="small" className="w-40 truncate">{product.title}</Text>
                      <div className="flex-1 rounded bg-ui-bg-subtle">
                        <div
                          className="h-2 rounded text-ui-fg-interactive"
                          style={{ width: `${pct}%`, backgroundColor: "currentColor" }}
                        />
                      </div>
                      <Text size="small" className="w-24 text-right">{money(product.revenue)}</Text>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({ label: "Analytics", icon: ChartBar })
export default AnalyticsDashboard
