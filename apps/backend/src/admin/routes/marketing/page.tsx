import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EnvelopeSolid } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/sdk"
import type { MarketingSubscribersResponse } from "../../types/marketing"

const PAGE_SIZE = 20

const badgeColor = (status: string) =>
  status === "subscribed" ? "green" : status === "suppressed" ? "red" : "orange"

const MarketingPage = () => {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [preference, setPreference] = useState("all")
  const [customerType, setCustomerType] = useState("all")
  const [purchased, setPurchased] = useState("all")
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) })
  if (search) params.set("q", search)
  if (status !== "all") params.set("status", status)
  if (preference !== "all") params.set("primary_preference", preference)
  if (customerType !== "all") params.set("customer_type", customerType)
  if (purchased !== "all") params.set("has_purchased", purchased)
  const { data, isLoading, isError } = useQuery<MarketingSubscribersResponse>({
    queryKey: ["marketing-subscribers", page, search, status, preference, customerType, purchased],
    queryFn: () => sdk.client.fetch(`/admin/marketing/subscribers?${params.toString()}`),
  })

  return (
    <Container>
      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading>Marketing subscribers</Heading>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Consent, customer classification, automation state, purchase history, and revenue.
            </Text>
          </div>
          <div className="flex gap-2"><Link to="/marketing/dashboard"><Button size="small">Overview</Button></Link><Link to="/marketing/campaigns"><Button size="small" variant="secondary">Campaigns</Button></Link><Link to="/marketing/segments"><Button size="small" variant="secondary">Segments</Button></Link><Button size="small" variant="secondary" onClick={() => window.open(`/admin/marketing/subscribers/export?${params.toString()}`, "_blank")}>Export CSV</Button><Link to="/marketing/email-activity"><Button size="small" variant="secondary">Email activity</Button></Link></div>
        </div>

        <Input
          aria-label="Search subscribers by email"
          placeholder="Search email"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
          }}
        />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(0) }}><Select.Trigger><Select.Value placeholder="Status" /></Select.Trigger><Select.Content>{["all","subscribed","unsubscribed","suppressed","pending"].map((value) => <Select.Item key={value} value={value}>{value === "all" ? "All statuses" : value}</Select.Item>)}</Select.Content></Select>
          <Select value={preference} onValueChange={(value) => { setPreference(value); setPage(0) }}><Select.Trigger><Select.Value placeholder="Preference" /></Select.Trigger><Select.Content>{["all","footwear","outerwear","restocks","everything"].map((value) => <Select.Item key={value} value={value}>{value === "all" ? "All preferences" : value}</Select.Item>)}</Select.Content></Select>
          <Select value={customerType} onValueChange={(value) => { setCustomerType(value); setPage(0) }}><Select.Trigger><Select.Value placeholder="Customer type" /></Select.Trigger><Select.Content>{["all","first_time","returning","unknown"].map((value) => <Select.Item key={value} value={value}>{value === "all" ? "All customer types" : value}</Select.Item>)}</Select.Content></Select>
          <Select value={purchased} onValueChange={(value) => { setPurchased(value); setPage(0) }}><Select.Trigger><Select.Value placeholder="Purchase state" /></Select.Trigger><Select.Content><Select.Item value="all">All purchase states</Select.Item><Select.Item value="true">Has purchased</Select.Item><Select.Item value="false">No purchase</Select.Item></Select.Content></Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Text size="small" className="text-ui-fg-subtle">Loading subscribers…</Text></div>
        ) : isError ? (
          <Text size="small" className="text-ui-fg-error">Subscribers could not be loaded.</Text>
        ) : !data?.subscribers.length ? (
          <Text size="small" className="text-ui-fg-subtle">No subscribers match this view.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Preference</Table.HeaderCell>
                <Table.HeaderCell>Source</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Orders</Table.HeaderCell>
                <Table.HeaderCell>Revenue</Table.HeaderCell>
                <Table.HeaderCell>Subscribed</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.subscribers.map((subscriber) => (
                <Table.Row key={subscriber.id}>
                  <Table.Cell>
                    <Link className="text-ui-fg-interactive hover:underline" to={`/marketing/${subscriber.id}`}>
                      {subscriber.email}
                    </Link>
                  </Table.Cell>
                  <Table.Cell><Badge color={badgeColor(subscriber.status)}>{subscriber.status}</Badge></Table.Cell>
                  <Table.Cell>{subscriber.primary_preference}</Table.Cell>
                  <Table.Cell>{subscriber.source_latest}</Table.Cell>
                  <Table.Cell>{subscriber.customer_type}</Table.Cell>
                  <Table.Cell>{subscriber.order_count}</Table.Cell>
                  <Table.Cell>{new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(Number(subscriber.lifetime_revenue || 0))}</Table.Cell>
                  <Table.Cell>{new Date(subscriber.subscribed_at).toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" })}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        <div className="flex items-center justify-between">
          <Text size="small" className="text-ui-fg-subtle">
            {data ? `${data.count} total` : ""}
          </Text>
          <div className="flex gap-2">
            <Button size="small" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
            <Button size="small" variant="secondary" disabled={!data || (page + 1) * PAGE_SIZE >= data.count} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Marketing", icon: EnvelopeSolid })
export default MarketingPage
