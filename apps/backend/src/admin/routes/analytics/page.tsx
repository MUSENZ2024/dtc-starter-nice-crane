import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Container, Heading, Input, Table, Tabs, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

const money = (n: number) => new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(n || 0)
const date = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).format(d) }
const Ranking = ({ title, rows, moneyValue = false }: any) => <Container><div className="p-6"><Heading level="h2">{title}</Heading><Table><Table.Body>{(rows || []).map((row: any) => <Table.Row key={row.label}><Table.Cell>{row.label}</Table.Cell><Table.Cell className="text-right">{moneyValue ? money(row.revenue) : row.visits ?? row.quantity}</Table.Cell></Table.Row>)}</Table.Body></Table>{!rows?.length && <Text size="small" className="mt-3 text-ui-fg-subtle">No data for this period.</Text>}</div></Container>

const AnalyticsPage = () => {
  const [from, setFrom] = useState(() => date(-29)); const [to, setTo] = useState(() => date())
  const { data, isLoading, isError } = useQuery<any>({ queryKey: ["muse-analytics", from, to], queryFn: () => sdk.client.fetch(`/admin/muse-analytics?from=${from}&to=${to}`) })
  if (isLoading) return <Container><div className="p-6"><Text>Loading analytics…</Text></div></Container>
  if (isError || !data) return <Container><div className="p-6"><Text className="text-ui-fg-error">Analytics could not be loaded.</Text></div></Container>
  const sales = data.sales; const traffic = data.traffic
  return <div className="flex flex-col gap-4"><Container><div className="flex flex-col gap-4 p-6"><div><Heading>Sales & Traffic</Heading><Text size="small" className="text-ui-fg-subtle">NZD sales reporting in Pacific/Auckland, excluding canceled orders.</Text></div><div className="grid max-w-xl grid-cols-2 gap-3"><label><Text size="xsmall">From</Text><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label><Text size="xsmall">To</Text><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div></div></Container>
    <Tabs defaultValue="sales"><Tabs.List><Tabs.Trigger value="sales">Sales</Tabs.Trigger><Tabs.Trigger value="traffic">Traffic</Tabs.Trigger></Tabs.List>
      <Tabs.Content value="sales"><div className="mt-4 flex flex-col gap-4"><Container><div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-5">{[["Revenue",money(sales.kpis.revenue)],["Average order value",money(sales.kpis.aov)],["Orders",sales.kpis.orders],["Units sold",sales.kpis.units_sold],["Discounts",money(sales.kpis.discounts)]].map(([l,v]) => <div key={l as string} className="rounded-lg border p-3"><Text size="xsmall" className="text-ui-fg-subtle">{l}</Text><Heading level="h2">{v}</Heading></div>)}</div></Container><div className="grid gap-4 lg:grid-cols-2"><Ranking title="Best-selling products" rows={sales.products} moneyValue /><Ranking title="Best-selling brands" rows={sales.brands} moneyValue /><Ranking title="Best-selling colours" rows={sales.colours} /><Ranking title="Best-selling sizes" rows={sales.sizes} /><Ranking title="Discounts used" rows={sales.discounts} moneyValue /><Ranking title="Sales by region" rows={sales.regions} moneyValue /></div></div></Tabs.Content>
      <Tabs.Content value="traffic"><div className="mt-4 flex flex-col gap-4">{traffic.message && <Container><div className="p-6"><Text className="text-ui-fg-subtle">{traffic.message}</Text></div></Container>}{traffic.kpis && <Container><div className="grid grid-cols-3 gap-3 p-6">{[["Visits",traffic.kpis.visits],["Users",traffic.kpis.users],["Page views",traffic.kpis.page_views]].map(([l,v]) => <div key={l as string} className="rounded-lg border p-3"><Text size="xsmall" className="text-ui-fg-subtle">{l}</Text><Heading level="h2">{v}</Heading></div>)}</div></Container>}<div className="grid gap-4 lg:grid-cols-2"><Ranking title="Top sources by visits" rows={traffic.sources}/><Ranking title="Geography" rows={traffic.geography}/><Ranking title="Top devices by visits" rows={traffic.devices}/><Ranking title="Top browsers by visits" rows={traffic.browsers}/><Ranking title="Top operating systems by visits" rows={traffic.operating_systems}/><Ranking title="Campaign keywords" rows={traffic.campaign_keywords}/><Ranking title="On-site searches" rows={traffic.searches}/></div></div></Tabs.Content>
    </Tabs></div>
}
export const config = defineRouteConfig({ label: "Analytics", icon: ChartBar })
export default AnalyticsPage
