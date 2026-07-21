import { ArrowLeft, Eye } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Table,
  Text,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sdk } from "../../../lib/sdk";
import {
  AbandonedCartCampaign,
  AbandonedCartEmailEvent,
  dateTime,
  money,
} from "../../../types/abandoned-cart";

type DetailResponse = {
  campaign: AbandonedCartCampaign;
  events: AbandonedCartEmailEvent[];
  cart: Record<string, any> | null;
  customer_orders: Array<Record<string, any>>;
  customer_order_count: number;
  customer_lifetime_value: number;
};

const statusColor = (status: string) =>
  status === "sent" || status === "recovered"
    ? "green"
    : status === "failed"
      ? "red"
      : status === "sending"
        ? "blue"
        : status === "scheduled" || status === "active"
          ? "orange"
          : "grey";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-y-1">
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {label}
      </Text>
      <Text size="small" leading="compact" weight="plus">
        {value || "—"}
      </Text>
    </div>
  );
}

function addressLines(address?: Record<string, any> | null) {
  if (!address) return ["Not provided"];
  return [
    [address.first_name, address.last_name].filter(Boolean).join(" "),
    address.address_1,
    address.address_2,
    [address.city, address.province, address.postal_code]
      .filter(Boolean)
      .join(" "),
    address.country_code?.toUpperCase(),
    address.phone,
  ].filter(Boolean);
}

const AbandonedCartDetailPage = () => {
  const { id } = useParams();
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const { data, isLoading } = useQuery<DetailResponse>({
    queryKey: ["abandoned-cart", id],
    queryFn: () => sdk.client.fetch(`/admin/abandoned-carts/${id}`),
    enabled: Boolean(id),
  });
  const preview = useQuery<{
    html: string;
    subject: string;
    sequence_number: number;
    status: string;
  }>({
    queryKey: ["abandoned-cart-preview", id, previewEventId],
    queryFn: () =>
      sdk.client.fetch(
        `/admin/abandoned-carts/${id}/emails/${previewEventId}/preview`,
      ),
    enabled: Boolean(id && previewEventId),
  });

  if (isLoading || !data)
    return (
      <Container>
        <Text size="small" leading="compact">
          Loading abandoned cart…
        </Text>
      </Container>
    );
  const { campaign, events } = data;
  const snapshot = campaign.snapshot || {};
  const cart = data.cart || snapshot;
  const items = cart.items || snapshot.items || [];
  const shippingAddress = cart.shipping_address || snapshot.shipping_address;
  const billingAddress = cart.billing_address || snapshot.billing_address;
  const paymentCollection =
    cart.payment_collection || snapshot.payment_collection;

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center gap-3">
        <Button asChild size="small" variant="secondary">
          <Link to="/abandoned-carts">
            <ArrowLeft /> Back
          </Link>
        </Button>
        <div>
          <Heading>{campaign.customer_name}</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {campaign.email} · {campaign.cart_id}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Container className="px-6 py-4">
          <Field
            label="Cart value"
            value={money(campaign.cart_value, campaign.currency_code)}
          />
        </Container>
        <Container className="px-6 py-4">
          <Field
            label="Campaign"
            value={
              <Badge color={statusColor(campaign.status)}>
                {campaign.status}
              </Badge>
            }
          />
        </Container>
        <Container className="px-6 py-4">
          <Field
            label="Latest email"
            value={
              <Badge color={statusColor(campaign.last_email_status)}>
                {campaign.last_email_status.replaceAll("_", " ")}
              </Badge>
            }
          />
        </Container>
        <Container className="px-6 py-4">
          <Field
            label="Recovered revenue"
            value={
              campaign.status === "recovered"
                ? money(campaign.recovered_revenue, campaign.currency_code)
                : "—"
            }
          />
        </Container>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Customer and cart</Heading>
        </div>
        <div className="grid grid-cols-2 gap-6 px-6 py-4 lg:grid-cols-4">
          <Field label="Customer" value={campaign.customer_name} />
          <Field label="Email" value={campaign.email} />
          <Field
            label="Segment"
            value={
              campaign.segment === "returning"
                ? "Returning customer"
                : "First-time customer"
            }
          />
          <Field
            label="Stage"
            value={
              campaign.checkout_stage === "checkout"
                ? "Checkout started"
                : "Cart"
            }
          />
          <Field label="Abandoned" value={dateTime(campaign.abandoned_at)} />
          <Field
            label="Last activity"
            value={dateTime(campaign.last_activity_at)}
          />
          <Field label="Previous orders" value={data.customer_order_count} />
          <Field
            label="Lifetime value"
            value={money(data.customer_lifetime_value, campaign.currency_code)}
          />
          <Field
            label="Free shipping"
            value={
              campaign.free_shipping_qualified
                ? "Qualified"
                : `${money(campaign.free_shipping_remaining, campaign.currency_code)} remaining`
            }
          />
          <Field
            label="Recovery clicked"
            value={dateTime(campaign.clicked_at)}
          />
          <Field label="Recovered" value={dateTime(campaign.recovered_at)} />
          <Field
            label="Recovered order"
            value={
              campaign.recovered_order_id ? (
                <Link
                  className="text-ui-fg-interactive"
                  to={`/orders/${campaign.recovered_order_id}`}
                >
                  {campaign.recovered_order_id}
                </Link>
              ) : (
                "—"
              )
            }
          />
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Items</Heading>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Variant</Table.HeaderCell>
              <Table.HeaderCell>Quantity</Table.HeaderCell>
              <Table.HeaderCell>Unit price</Table.HeaderCell>
              <Table.HeaderCell>Total</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item: any) => {
              const title = item.product_title || item.title;
              const variant = item.variant_title || item.variantTitle;
              const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
              const quantity = Number(item.quantity || 1);
              return (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : null}
                      <Text size="small" leading="compact" weight="plus">
                        {title}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{variant || "—"}</Table.Cell>
                  <Table.Cell>{quantity}</Table.Cell>
                  <Table.Cell>
                    {money(unitPrice, campaign.currency_code)}
                  </Table.Cell>
                  <Table.Cell>
                    {money(unitPrice * quantity, campaign.currency_code)}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </Container>

      <div className="grid gap-3 lg:grid-cols-3">
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              Shipping address
            </Text>
          </div>
          <div className="px-6 py-4">
            {addressLines(shippingAddress).map((line) => (
              <Text key={line} size="small" leading="compact">
                {line}
              </Text>
            ))}
          </div>
        </Container>
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              Billing address
            </Text>
          </div>
          <div className="px-6 py-4">
            {addressLines(billingAddress).map((line) => (
              <Text key={line} size="small" leading="compact">
                {line}
              </Text>
            ))}
          </div>
        </Container>
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              Checkout and payment
            </Text>
          </div>
          <div className="flex flex-col gap-3 px-6 py-4">
            <Field
              label="Shipping method"
              value={
                (cart.shipping_methods || snapshot.shipping_methods || [])[0]
                  ?.name
              }
            />
            <Field
              label="Payment collection"
              value={paymentCollection?.status}
            />
            <Field
              label="Payment provider"
              value={paymentCollection?.payment_sessions?.[0]?.provider_id}
            />
            <Field
              label="Payment session"
              value={paymentCollection?.payment_sessions?.[0]?.status}
            />
          </div>
        </Container>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Email activity</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Every scheduled, sent, failed or cancelled message. Preview uses the
            exact customer segment and cart snapshot.
          </Text>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Subject</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Scheduled</Table.HeaderCell>
              <Table.HeaderCell>Sent / failed</Table.HeaderCell>
              <Table.HeaderCell>Clicked</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {events.map((event) => (
              <Table.Row key={event.id}>
                <Table.Cell>Email {event.sequence_number}</Table.Cell>
                <Table.Cell>{event.subject}</Table.Cell>
                <Table.Cell>
                  <Badge color={statusColor(event.status)}>
                    {event.status}
                  </Badge>
                  {event.error_message ? (
                    <Text
                      size="small"
                      leading="compact"
                      className="mt-1 text-ui-fg-error"
                    >
                      {event.error_message}
                    </Text>
                  ) : null}
                </Table.Cell>
                <Table.Cell>{dateTime(event.scheduled_at)}</Table.Cell>
                <Table.Cell>
                  {dateTime(
                    event.sent_at || event.failed_at || event.cancelled_at,
                  )}
                </Table.Cell>
                <Table.Cell>{dateTime(event.clicked_at)}</Table.Cell>
                <Table.Cell>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setPreviewEventId(event.id)}
                  >
                    <Eye /> Preview
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Customer order history</Heading>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Payment</Table.HeaderCell>
              <Table.HeaderCell>Fulfilment</Table.HeaderCell>
              <Table.HeaderCell>Total</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.customer_orders.length ? (
              data.customer_orders.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>
                    <Link
                      className="text-ui-fg-interactive"
                      to={`/orders/${order.id}`}
                    >
                      #{order.display_id}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{dateTime(order.created_at)}</Table.Cell>
                  <Table.Cell>{order.payment_status}</Table.Cell>
                  <Table.Cell>{order.fulfillment_status}</Table.Cell>
                  <Table.Cell>
                    {money(order.total, order.currency_code)}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell>No previous orders.</Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Container>

      <FocusModal
        open={Boolean(previewEventId)}
        onOpenChange={(open) => {
          if (!open) setPreviewEventId(null);
        }}
      >
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <Text size="small" leading="compact" weight="plus">
                    Email {preview.data?.sequence_number} preview
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {preview.data?.subject}
                  </Text>
                </div>
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary">
                    Close
                  </Button>
                </FocusModal.Close>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 bg-ui-bg-subtle p-4">
              {preview.isLoading ? (
                <Text size="small" leading="compact">
                  Rendering email…
                </Text>
              ) : preview.data ? (
                <iframe
                  title="Abandoned cart email preview"
                  srcDoc={preview.data.html}
                  className="h-full w-full rounded-lg border-0 bg-white"
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                />
              ) : (
                <Text size="small" className="text-ui-fg-error">
                  Email preview could not be loaded.
                </Text>
              )}
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </div>
  );
};

export default AbandonedCartDetailPage;
