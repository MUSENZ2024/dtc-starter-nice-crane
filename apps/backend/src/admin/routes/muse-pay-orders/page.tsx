import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CreditCardSolid } from "@medusajs/icons"
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type MusePayOrder = {
  id: string
  display_id: number | string
  created_at: string
  currency_code: string
  total: number
  customer_name: string
  email: string | null
  payment_status: string | null
  fulfillment_status: string | null
  split_pay_schedule_id: string | null
}

const formatMoney = (amount: number, currencyCode: string) =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    currencyDisplay: "narrowSymbol",
  }).format(amount)

const statusColor = (status: string | null) => {
  if (status === "captured") return "green"
  if (status === "authorized") return "orange"
  if (status === "canceled") return "red"
  return "grey"
}

const MusePayOrdersPage = () => {
  const { data, isLoading } = useQuery<{ orders: MusePayOrder[]; count: number }>({
    queryKey: ["muse-pay-orders"],
    queryFn: () => sdk.client.fetch("/admin/muse-pay-orders"),
  })

  return (
    <Container>
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-ui-tag-orange-bg">
            <CreditCardSolid className="text-ui-tag-orange-icon" />
          </div>
          <div>
            <Heading level="h2">MUSE Pay Orders</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Orders paid via 4 weekly instalments — held until the final payment clears.
            </Text>
          </div>
        </div>
        <Badge color="orange">{data?.count ?? 0} total</Badge>
      </div>

      <Table className="mt-4">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Order</Table.HeaderCell>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Payment</Table.HeaderCell>
            <Table.HeaderCell>Fulfillment</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            <Table.Row>
              <Table.Cell>
                <Text className="text-ui-fg-subtle">Loading MUSE Pay orders…</Text>
              </Table.Cell>
              <Table.Cell /><Table.Cell /><Table.Cell /><Table.Cell /><Table.Cell />
            </Table.Row>
          ) : data?.orders.length ? (
            data.orders.map((order) => (
              <Table.Row key={order.id} className="[&>td]:align-middle">
                <Table.Cell>
                  <Link to={`/orders/${order.id}`} className="font-medium hover:underline">
                    #{order.display_id}
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  {new Date(order.created_at).toLocaleDateString("en-NZ", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Table.Cell>
                <Table.Cell>
                  <div>{order.customer_name}</div>
                  {order.email && (
                    <div className="text-ui-fg-subtle text-xs">{order.email}</div>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Badge color={statusColor(order.payment_status)}>
                    {order.payment_status ?? "unknown"}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="capitalize">
                  {(order.fulfillment_status ?? "not_fulfilled").replace(/_/g, " ")}
                </Table.Cell>
                <Table.Cell className="text-right font-medium">
                  {formatMoney(order.total, order.currency_code)}
                </Table.Cell>
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell>
                <Text className="text-ui-fg-subtle">No MUSE Pay orders yet.</Text>
              </Table.Cell>
              <Table.Cell /><Table.Cell /><Table.Cell /><Table.Cell /><Table.Cell />
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "MUSE Pay Orders",
  icon: CreditCardSolid,
})

export default MusePayOrdersPage
