import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../../lib/sdk"

type Offer = { id: string; key: string; name: string; status: string; amount: number; currency_code: string; minimum_spend: number; expires_after_hours: number; first_order_only: boolean; combinable: boolean }
type Issuance = { id: string; code: string; status: string; issued_at: string; expires_at: string; promotion_id: string }

const MarketingOffersPage = () => {
  const client = useQueryClient()
  const query = useQuery<{ offers: Offer[]; issuances: Issuance[] }>({ queryKey: ["marketing-offers"], queryFn: () => sdk.client.fetch("/admin/marketing/offers") })
  const create = useMutation({ mutationFn: () => sdk.client.fetch("/admin/marketing/offers", { method: "POST" }), onSuccess: () => client.invalidateQueries({ queryKey: ["marketing-offers"] }) })
  const setStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => sdk.client.fetch(`/admin/marketing/offers/${id}`, { method: "POST", body: { status } }), onSuccess: () => client.invalidateQueries({ queryKey: ["marketing-offers"] }) })
  const offer = query.data?.offers[0]

  return <div className="flex flex-col gap-3">
    <Container><div className="flex items-center justify-between px-6 py-4"><div><Heading>Welcome offer</Heading><Text size="small" className="text-ui-fg-subtle">Native Medusa promotion issuance and redemption controls.</Text></div>{offer ? <Badge color={offer.status === "active" ? "green" : "grey"}>{offer.status}</Badge> : <Button size="small" onClick={() => create.mutate()}>Create draft offer</Button>}</div>
      {offer && <div className="grid grid-cols-2 gap-4 px-6 pb-6 md:grid-cols-4"><div><Text size="small" weight="plus">Value</Text><Text>NZ${offer.amount} off</Text></div><div><Text size="small" weight="plus">Minimum</Text><Text>NZ${offer.minimum_spend}</Text></div><div><Text size="small" weight="plus">Expiry</Text><Text>{offer.expires_after_hours} hours</Text></div><div><Text size="small" weight="plus">Controls</Text><Text>{offer.first_order_only ? "First order" : "All orders"} · {offer.combinable ? "Combinable" : "Single code"}</Text></div><div className="col-span-full flex gap-2"><Button size="small" disabled={offer.status === "active"} onClick={() => setStatus.mutate({ id: offer.id, status: "active" })}>Activate locally</Button><Button size="small" variant="secondary" disabled={offer.status !== "active"} onClick={() => setStatus.mutate({ id: offer.id, status: "paused" })}>Pause</Button></div></div>}
    </Container>
    <Container><div className="px-6 py-4"><Heading level="h2">Issuances</Heading><Text size="small" className="text-ui-fg-subtle">Latest 100 unique codes. Codes are never returned by the public signup endpoint.</Text></div><Table><Table.Header><Table.Row><Table.HeaderCell>Code</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell>Issued</Table.HeaderCell><Table.HeaderCell>Expires</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{(query.data?.issuances || []).map((row) => <Table.Row key={row.id}><Table.Cell>{row.code}</Table.Cell><Table.Cell><Badge color="grey">{row.status}</Badge></Table.Cell><Table.Cell>{new Date(row.issued_at).toLocaleString("en-NZ")}</Table.Cell><Table.Cell>{new Date(row.expires_at).toLocaleString("en-NZ")}</Table.Cell></Table.Row>)}</Table.Body></Table>{!query.isLoading && !query.data?.issuances.length && <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">No codes issued.</Text></div>}</Container>
  </div>
}

export default MarketingOffersPage
