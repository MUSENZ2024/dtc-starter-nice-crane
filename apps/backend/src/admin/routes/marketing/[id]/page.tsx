import { Badge, Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { sdk } from "../../../lib/sdk"
import type { MarketingSubscriber } from "../../../types/marketing"

const MarketingSubscriberPage = () => {
  const { id } = useParams()
  const client = useQueryClient()
  const { data, isLoading, isError } = useQuery<{ subscriber: MarketingSubscriber & { enrollments?: any[]; email_events?: any[]; offer_issuances?: any[] }; orders: any[] }>({
    queryKey: ["marketing-subscriber", id],
    queryFn: () => sdk.client.fetch(`/admin/marketing/subscribers/${id}`),
    enabled: Boolean(id),
  })
  const suppress = useMutation({ mutationFn: ({ reason, confirmation }: { reason: string; confirmation: string }) => sdk.client.fetch(`/admin/marketing/subscribers/${id}/suppress`, { method: "POST", body: { reason, confirmation } }), onSuccess: () => { client.invalidateQueries({ queryKey: ["marketing-subscriber", id] }); client.invalidateQueries({ queryKey: ["marketing-subscribers"] }); client.invalidateQueries({ queryKey: ["marketing-email-activity"] }); toast.success("Subscriber suppressed") }, onError: (error: Error) => toast.error(error.message) })
  const suppressSubscriber = () => { const reason = window.prompt("Suppression reason (required)"); if (!reason) return; const confirmation = window.prompt("Type SUPPRESS to confirm. This does not delete consent history."); if (confirmation) suppress.mutate({ reason, confirmation }) }

  if (isLoading) return <Container><div className="flex justify-center py-16"><Text size="small" className="text-ui-fg-subtle">Loading subscriber…</Text></div></Container>
  if (isError || !data?.subscriber) return <Container><Text className="text-ui-fg-error">Subscriber could not be loaded.</Text></Container>

  const subscriber = data.subscriber
  const consentEvents = [...(subscriber.consent_events || [])].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
  const preferenceEvents = [...(subscriber.preference_events || [])].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
  const enrollments = [...(subscriber.enrollments || [])]
  const emailEvents = [...(subscriber.email_events || [])].sort((a, b) => String(b.scheduled_at).localeCompare(String(a.scheduled_at)))
  const offers = [...(subscriber.offer_issuances || [])]
  const orders = data.orders || []

  return (
    <div className="flex flex-col gap-3">
      <Container>
        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="flex items-center justify-between"><Heading>{subscriber.email}</Heading><div className="flex gap-2"><Badge color="grey">{subscriber.status}</Badge>{subscriber.status !== "suppressed" && <Button size="small" variant="danger" disabled={suppress.isPending} onClick={suppressSubscriber}>Suppress safely</Button>}</div></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div><Text size="small" weight="plus">Preference</Text><Text size="small" className="text-ui-fg-subtle">{subscriber.primary_preference}</Text></div>
            <div><Text size="small" weight="plus">Customer type</Text><Text size="small" className="text-ui-fg-subtle">{subscriber.customer_type}</Text></div>
            <div><Text size="small" weight="plus">Latest source</Text><Text size="small" className="text-ui-fg-subtle">{subscriber.source_latest}</Text></div>
          </div>{subscriber.suppression_reason && <Text size="small" className="text-ui-fg-error">Suppression reason: {subscriber.suppression_reason}</Text>}
        </div>
      </Container>

      <Container><div className="px-6 py-4"><Text size="small" weight="plus">Flow enrollments</Text></div><Table><Table.Header><Table.Row><Table.HeaderCell>Flow</Table.HeaderCell><Table.HeaderCell>Version</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Entered</Table.HeaderCell><Table.HeaderCell>Exit</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{enrollments.map((item) => <Table.Row key={item.id}><Table.Cell>{item.flow?.name || item.flow_id}</Table.Cell><Table.Cell>{item.flow_version}</Table.Cell><Table.Cell>{item.status}</Table.Cell><Table.Cell>{new Date(item.entered_at).toLocaleString("en-NZ")}</Table.Cell><Table.Cell>{item.cancel_reason || item.converted_order_id || "—"}</Table.Cell></Table.Row>)}</Table.Body></Table>{!enrollments.length && <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">No flow enrollments.</Text></div>}</Container>

      <Container><div className="px-6 py-4"><Text size="small" weight="plus">Email history</Text></div><Table><Table.Header><Table.Row><Table.HeaderCell>Subject</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Scheduled</Table.HeaderCell><Table.HeaderCell>Attempts</Table.HeaderCell><Table.HeaderCell>Preview</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{emailEvents.map((event) => <Table.Row key={event.id}><Table.Cell>{event.subject_snapshot}</Table.Cell><Table.Cell>{event.status}</Table.Cell><Table.Cell>{new Date(event.scheduled_at).toLocaleString("en-NZ")}</Table.Cell><Table.Cell>{event.attempt_count}</Table.Cell><Table.Cell><Button size="small" variant="secondary" onClick={() => window.open(`/admin/marketing/email-events/${event.id}/preview`, "_blank")}>Preview</Button></Table.Cell></Table.Row>)}</Table.Body></Table>{!emailEvents.length && <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">No email events.</Text></div>}</Container>

      <Container><div className="px-6 py-4"><Text size="small" weight="plus">Welcome offers</Text></div><Table><Table.Header><Table.Row><Table.HeaderCell>Code</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Issued</Table.HeaderCell><Table.HeaderCell>Expires</Table.HeaderCell><Table.HeaderCell>Redeemed order</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{offers.map((offer) => <Table.Row key={offer.id}><Table.Cell>{offer.code}</Table.Cell><Table.Cell>{offer.status}</Table.Cell><Table.Cell>{new Date(offer.issued_at).toLocaleString("en-NZ")}</Table.Cell><Table.Cell>{new Date(offer.expires_at).toLocaleString("en-NZ")}</Table.Cell><Table.Cell>{offer.redeemed_order_id || "—"}</Table.Cell></Table.Row>)}</Table.Body></Table>{!offers.length && <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">No offers issued.</Text></div>}</Container>

      <Container><div className="px-6 py-4"><Text size="small" weight="plus">Orders and revenue</Text><Text size="small" className="text-ui-fg-subtle">{orders.length} orders · {new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(Number(subscriber.lifetime_revenue || 0))} lifetime revenue</Text></div><Table><Table.Header><Table.Row><Table.HeaderCell>Order</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Date</Table.HeaderCell><Table.HeaderCell>Total</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{orders.map((order) => <Table.Row key={order.id}><Table.Cell>#{order.display_id}</Table.Cell><Table.Cell>{order.status}</Table.Cell><Table.Cell>{new Date(order.created_at).toLocaleString("en-NZ")}</Table.Cell><Table.Cell>{new Intl.NumberFormat("en-NZ", { style: "currency", currency: String(order.currency_code || "NZD").toUpperCase() }).format(Number(order.total || 0))}</Table.Cell></Table.Row>)}</Table.Body></Table>{!orders.length && <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">No matching orders.</Text></div>}</Container>

      <Container>
        <div className="px-6 py-4"><Text size="small" weight="plus">Consent history</Text></div>
        <Table>
          <Table.Header><Table.Row><Table.HeaderCell>Action</Table.HeaderCell><Table.HeaderCell>Source</Table.HeaderCell><Table.HeaderCell>Policy</Table.HeaderCell><Table.HeaderCell>Occurred</Table.HeaderCell></Table.Row></Table.Header>
          <Table.Body>{consentEvents.map((event) => <Table.Row key={event.id}><Table.Cell>{event.action}</Table.Cell><Table.Cell>{event.source}</Table.Cell><Table.Cell>{event.privacy_policy_version}</Table.Cell><Table.Cell>{new Date(event.occurred_at).toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" })}</Table.Cell></Table.Row>)}</Table.Body>
        </Table>
        {!consentEvents.length && <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">No consent events recorded.</Text></div>}
      </Container>

      <Container>
        <div className="px-6 py-4"><Text size="small" weight="plus">Preference history</Text></div>
        <Table>
          <Table.Header><Table.Row><Table.HeaderCell>Preference</Table.HeaderCell><Table.HeaderCell>Source</Table.HeaderCell><Table.HeaderCell>Occurred</Table.HeaderCell></Table.Row></Table.Header>
          <Table.Body>{preferenceEvents.map((event) => <Table.Row key={event.id}><Table.Cell>{event.preference}</Table.Cell><Table.Cell>{event.source}</Table.Cell><Table.Cell>{new Date(event.occurred_at).toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" })}</Table.Cell></Table.Row>)}</Table.Body>
        </Table>
        {!preferenceEvents.length && <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">No preference events recorded.</Text></div>}
      </Container>
    </div>
  )
}

export default MarketingSubscriberPage
