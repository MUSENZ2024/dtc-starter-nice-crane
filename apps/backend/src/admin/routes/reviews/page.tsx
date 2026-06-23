import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Table } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

type Review = {
  id: string
  reviewer_name: string
  content: string
  rating: number
  status: "pending" | "approved" | "rejected"
  source: "legacy" | "customer"
  verified_purchase: boolean
}

const statusColor = (status: Review["status"]) =>
  status === "approved" ? "green" : status === "rejected" ? "red" : "orange"

const ReviewsPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ reviews: Review[] }>({
    queryKey: ["reviews"],
    queryFn: () => sdk.client.fetch("/admin/reviews"),
  })
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      sdk.client.fetch(`/admin/reviews/${id}/status`, { method: "POST", body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  })

  return <Container>
    <div className="flex items-center justify-between">
      <div><Heading>Reviews</Heading><p className="text-ui-fg-subtle">Approve customer submissions before they appear on the storefront.</p></div>
      <Badge color="orange">{data?.reviews.filter((review) => review.status === "pending").length ?? 0} pending</Badge>
    </div>
    <Table className="mt-6">
      <Table.Header><Table.Row><Table.HeaderCell>Reviewer</Table.HeaderCell><Table.HeaderCell>Rating</Table.HeaderCell><Table.HeaderCell>Review</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell><Table.HeaderCell /></Table.Row></Table.Header>
      <Table.Body>{isLoading ? <Table.Row><Table.Cell>Loading reviews…</Table.Cell><Table.Cell /><Table.Cell /><Table.Cell /><Table.Cell /></Table.Row> : data?.reviews.map((review) => <Table.Row key={review.id}>
        <Table.Cell><div className="font-medium">{review.reviewer_name}</div><div className="text-ui-fg-subtle text-xs">{review.source}{review.verified_purchase ? " · verified" : ""}</div></Table.Cell>
        <Table.Cell>{review.rating}/5</Table.Cell><Table.Cell className="max-w-lg whitespace-normal">{review.content}</Table.Cell>
        <Table.Cell><Badge color={statusColor(review.status)}>{review.status}</Badge></Table.Cell>
        <Table.Cell>{review.status === "pending" && <div className="flex gap-2"><Button size="small" onClick={() => update.mutate({ id: review.id, status: "approved" })} isLoading={update.isPending}>Approve</Button><Button size="small" variant="secondary" onClick={() => update.mutate({ id: review.id, status: "rejected" })}>Reject</Button></div>}</Table.Cell>
      </Table.Row>)}</Table.Body>
    </Table>
  </Container>
}

export const config = defineRouteConfig({ label: "Reviews", icon: ChatBubbleLeftRight })
export default ReviewsPage
