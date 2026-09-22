import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingBag, Spinner } from "@medusajs/icons"
import { Badge, Button, Container, Select, Text, Textarea } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type RequestStatus = "pending" | "reviewing" | "quoted" | "closed"
type ItemRequest = {
  id: string; item_name: string; item_type: string; details?: string; requester_name: string
  email: string; phone?: string; image_url: string; status: RequestStatus; admin_note?: string; created_at: string
}

const statusColor = (status: RequestStatus) => status === "quoted" ? "green" : status === "closed" ? "grey" : status === "reviewing" ? "blue" : "orange"

function RequestCard({ request }: { request: ItemRequest }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<RequestStatus>(request.status)
  const [note, setNote] = useState(request.admin_note ?? "")
  const update = useMutation({
    mutationFn: () => sdk.client.fetch(`/admin/item-requests/${request.id}`, { method: "POST", body: { status, admin_note: note || undefined } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["item-requests"] }),
  })

  return <Container className="p-0 overflow-hidden"><div className="grid grid-cols-[160px_1fr]"><a href={request.image_url} target="_blank" rel="noreferrer" className="block bg-ui-bg-subtle"><img src={request.image_url} alt={request.item_name} className="h-full min-h-[190px] w-full object-cover" /></a><div className="px-6 py-4"><div className="flex items-start justify-between gap-4"><div><Text size="small" leading="compact" weight="plus">{request.item_name}</Text><Text size="small" leading="compact" className="mt-1 text-ui-fg-subtle">{request.item_type} · {new Date(request.created_at).toLocaleDateString("en-NZ")}</Text></div><Badge color={statusColor(request.status)}>{request.status}</Badge></div>{request.details && <Text size="small" leading="compact" className="mt-3">{request.details}</Text>}<div className="mt-4 grid grid-cols-2 gap-3"><div><Text size="small" leading="compact" weight="plus">Customer</Text><Text size="small" leading="compact" className="text-ui-fg-subtle">{request.requester_name}</Text></div><div><Text size="small" leading="compact" weight="plus">Contact</Text><a className="block text-ui-fg-interactive text-sm" href={`mailto:${request.email}`}>{request.email}</a>{request.phone && <a className="block text-ui-fg-interactive text-sm" href={`tel:${request.phone}`}>{request.phone}</a>}</div></div><div className="mt-4 grid grid-cols-[160px_1fr_auto] items-end gap-3"><Select value={status} onValueChange={(value) => setStatus(value as RequestStatus)}><Select.Trigger><Select.Value /></Select.Trigger><Select.Content><Select.Item value="pending">Pending</Select.Item><Select.Item value="reviewing">Reviewing</Select.Item><Select.Item value="quoted">Quoted</Select.Item><Select.Item value="closed">Closed</Select.Item></Select.Content></Select><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Private admin note" rows={2} /><Button size="small" onClick={() => update.mutate()} disabled={update.isPending} isLoading={update.isPending}>Save</Button></div>{update.isError && <Text size="small" className="mt-2 text-ui-fg-error">Could not save this request.</Text>}</div></div></Container>
}

const ItemRequestsPage = () => {
  const { data, isLoading, isError } = useQuery<{ requests: ItemRequest[] }>({ queryKey: ["item-requests"], queryFn: () => sdk.client.fetch("/admin/item-requests") })
  return <div className="flex flex-col gap-3"><Container><div className="flex items-center justify-between"><div><Text size="small" leading="compact" weight="plus">Item requests</Text><Text size="small" leading="compact" className="mt-1 text-ui-fg-subtle">Photos and quote requests submitted from the Bags & Accessories page.</Text></div><Badge color="orange">{data?.requests.filter((request) => request.status === "pending").length ?? 0} pending</Badge></div></Container>{isLoading && <Container className="flex justify-center py-12"><Spinner /></Container>}{isError && <Container><Text size="small" className="text-ui-fg-error">Could not load item requests.</Text></Container>}{data?.requests.map((request) => <RequestCard key={request.id} request={request} />)}{!isLoading && !data?.requests.length && <Container><Text size="small" className="text-ui-fg-subtle">No item requests yet.</Text></Container>}</div>
}

export const config = defineRouteConfig({ label: "Item requests", icon: ShoppingBag })
export default ItemRequestsPage
