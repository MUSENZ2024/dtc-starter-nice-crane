import { Badge, Button, Container, Heading, Input, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

type Report = any
const money = (value: number) => new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(value || 0)
const percent = (value: number) => new Intl.NumberFormat("en-NZ", { style: "percent", maximumFractionDigits: 1 }).format(value || 0)
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
const defaultFrom = () => { const date = new Date(); date.setDate(date.getDate() - 29); return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).format(date) }

const MarketingDashboard = () => {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(today)
  const { data, isLoading, isError } = useQuery<Report>({ queryKey: ["marketing-dashboard", from, to], queryFn: () => sdk.client.fetch(`/admin/marketing/dashboard?from=${from}&to=${to}`) })
  if (isLoading) return <Container><div className="p-6"><Text>Loading marketing report…</Text></div></Container>
  if (isError || !data) return <Container><div className="p-6"><Text className="text-ui-fg-error">Marketing reporting could not be loaded.</Text></div></Container>
  const cards = [
    ["Active subscribers", data.kpis.active_subscribers], ["New subscribers", data.kpis.new_subscribers], ["Unsubscribes", data.kpis.unsubscribes],
    ["Emails sent", data.kpis.emails_sent], ["Allowance remaining", data.usage.allowance_remaining], ["Delivery rate", percent(data.kpis.delivery_rate)],
    ["Click rate", percent(data.kpis.click_rate)], ["Welcome conversion", percent(data.kpis.welcome_conversion_rate)], ["Attributed orders", data.kpis.attributed_orders],
    ["Attributed revenue", money(data.kpis.attributed_revenue)], ["Revenue / new subscriber", money(data.kpis.revenue_per_new_subscriber)], ["Recovered cart revenue", money(data.kpis.abandoned.recovered_revenue)],
  ]
  return <div className="flex flex-col gap-4">
    <Container><div className="flex flex-col gap-4 px-6 py-4">
      <div className="flex items-start justify-between gap-4"><div><Heading>Marketing overview</Heading><Text size="small" className="text-ui-fg-subtle">NZD reporting in Pacific/Auckland. Open rate is directional and excluded from headline KPIs.</Text></div><div className="flex gap-2"><Link to="/marketing"><Button size="small" variant="secondary">Subscribers</Button></Link><Link to="/marketing/email-activity"><Button size="small" variant="secondary">Email activity</Button></Link></div></div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4"><label><Text size="xsmall">From</Text><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label><Text size="xsmall">To</Text><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(([label,value]) => <div key={label} className="rounded-lg border p-3"><Text size="xsmall" className="text-ui-fg-subtle">{label}</Text><Heading level="h2">{value}</Heading></div>)}</div>
    </div></Container>
    {data.health.alerts.length > 0 && <Container><div className="p-6"><Heading level="h2">Health alerts</Heading><div className="mt-3 flex flex-col gap-2">{data.health.alerts.map((alert:any) => <div key={alert.code} className="flex gap-2"><Badge color={alert.level === "critical" ? "red" : "orange"}>{alert.level}</Badge><Text size="small">{alert.message}</Text></div>)}</div></div></Container>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Container><div className="p-6"><Heading level="h2">Welcome funnel</Heading><Table><Table.Body>{[["Eligible sessions",data.funnel.eligible_sessions],["Popup views",data.funnel.popup_views],["Preference selections",data.funnel.preference_selections],["Successful signups",data.funnel.signups],["Flow entrants",data.funnel.flow_entrants],["Purchasers",data.funnel.purchasers]].map(([label,value]) => <Table.Row key={label}><Table.Cell>{label}</Table.Cell><Table.Cell className="text-right">{value}</Table.Cell></Table.Row>)}</Table.Body></Table></div></Container>
      <Container><div className="p-6"><Heading level="h2">Email allowance forecast</Heading><div className="mt-3 grid grid-cols-2 gap-3">{[["Sent this month",data.usage.month_sent],["Projected month",data.usage.projected_month_sent],["Monthly allowance",data.usage.monthly_allowance],["Today / dispatch cap",`${data.usage.today_sent} / ${data.usage.daily_dispatch_cap}`]].map(([label,value]) => <div key={label} className="rounded-lg border p-3"><Text size="xsmall" className="text-ui-fg-subtle">{label}</Text><Text weight="plus">{value}</Text></div>)}</div></div></Container>
    </div>
    <Container><div className="p-6"><Heading level="h2">Daily activity</Heading><Table><Table.Header><Table.Row><Table.HeaderCell>Date (Auckland)</Table.HeaderCell><Table.HeaderCell>Subscribers</Table.HeaderCell><Table.HeaderCell>Sent</Table.HeaderCell><Table.HeaderCell>Delivered</Table.HeaderCell><Table.HeaderCell>Clicks</Table.HeaderCell><Table.HeaderCell>Revenue</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{data.time_series.map((row:any) => <Table.Row key={row.date}><Table.Cell>{row.date}</Table.Cell><Table.Cell>{row.subscribers}</Table.Cell><Table.Cell>{row.sent}</Table.Cell><Table.Cell>{row.delivered}</Table.Cell><Table.Cell>{row.clicked}</Table.Cell><Table.Cell>{money(row.revenue)}</Table.Cell></Table.Row>)}</Table.Body></Table></div></Container>
    <div className="grid gap-4 lg:grid-cols-2">
      <Container><div className="p-6"><Heading level="h2">Signup source performance</Heading><Table><Table.Header><Table.Row><Table.HeaderCell>Source</Table.HeaderCell><Table.HeaderCell>Signups</Table.HeaderCell><Table.HeaderCell>Orders</Table.HeaderCell><Table.HeaderCell>Conversion</Table.HeaderCell><Table.HeaderCell>Revenue</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{data.sources.map((row:any) => <Table.Row key={row.source}><Table.Cell>{row.source}</Table.Cell><Table.Cell>{row.subscribers}</Table.Cell><Table.Cell>{row.attributed_orders}</Table.Cell><Table.Cell>{percent(row.conversion_rate)}</Table.Cell><Table.Cell>{money(row.revenue)}</Table.Cell></Table.Row>)}</Table.Body></Table></div></Container>
      <Container><div className="p-6"><Heading level="h2">Revenue attribution</Heading><Table><Table.Header><Table.Row><Table.HeaderCell>Rule</Table.HeaderCell><Table.HeaderCell>Orders</Table.HeaderCell><Table.HeaderCell>Revenue</Table.HeaderCell><Table.HeaderCell>Discount</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{data.revenue.map((row:any) => <Table.Row key={row.channel}><Table.Cell>{row.channel}</Table.Cell><Table.Cell>{row.orders}</Table.Cell><Table.Cell>{money(row.revenue)}</Table.Cell><Table.Cell>{money(row.discount)}</Table.Cell></Table.Row>)}</Table.Body></Table><Text size="xsmall" className="mt-3 text-ui-fg-subtle">Promotion redemption is deterministic; otherwise last click within 7 days, then reliable open within 1 day. Each order contributes revenue once.</Text></div></Container>
    </div>
  </div>
}

export default MarketingDashboard
