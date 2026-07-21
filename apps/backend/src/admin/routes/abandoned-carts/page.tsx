import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ShoppingCart } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  Table,
  Text,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { sdk } from "../../lib/sdk";
import {
  AbandonedCartCampaign,
  CampaignStatus,
  EmailStatus,
  dateTime,
  money,
} from "../../types/abandoned-cart";

type ListResponse = {
  campaigns: AbandonedCartCampaign[];
  count: number;
  stats: {
    active: number;
    awaiting_email: number;
    emails_sent: number;
    recovered: number;
    recovered_revenue: number;
  };
};

const statusColor = (status: CampaignStatus) =>
  status === "recovered" ? "green" : status === "active" ? "orange" : "grey";
const emailColor = (status: EmailStatus) =>
  status === "sent"
    ? "green"
    : status === "failed"
      ? "red"
      : status === "sending"
        ? "blue"
        : "grey";

const AbandonedCartsPage = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [emailStatus, setEmailStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["abandoned-carts", q, status, emailStatus, offset],
    queryFn: () =>
      sdk.client.fetch("/admin/abandoned-carts", {
        query: {
          q: q || undefined,
          status: status === "all" ? undefined : status,
          email_status: emailStatus === "all" ? undefined : emailStatus,
          limit,
          offset,
        },
      }),
  });

  const stats = data?.stats;
  return (
    <div className="flex flex-col gap-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Active carts", stats?.active ?? 0],
          ["Awaiting email", stats?.awaiting_email ?? 0],
          ["Campaigns emailed", stats?.emails_sent ?? 0],
          ["Recovered carts", stats?.recovered ?? 0],
          ["Recovered revenue", money(stats?.recovered_revenue)],
        ].map(([label, value]) => (
          <Container key={String(label)} className="px-6 py-4">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {label}
            </Text>
            <Text size="large" leading="compact" weight="plus" className="mt-2">
              {value}
            </Text>
          </Container>
        ))}
      </div>

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Abandoned Carts</Heading>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Incomplete MUSE carts, email history and recovered revenue.
            </Text>
          </div>
          <Badge color="orange">{data?.count ?? 0} results</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-6 py-4">
          <Input
            placeholder="Search name, email or cart ID"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setOffset(0);
            }}
            className="min-w-64"
          />
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setOffset(0);
            }}
          >
            <Select.Trigger className="w-44">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All outcomes</Select.Item>
              <Select.Item value="active">Active</Select.Item>
              <Select.Item value="recovered">Recovered</Select.Item>
              <Select.Item value="cancelled">Cancelled</Select.Item>
              <Select.Item value="expired">Expired</Select.Item>
            </Select.Content>
          </Select>
          <Select
            value={emailStatus}
            onValueChange={(value) => {
              setEmailStatus(value);
              setOffset(0);
            }}
          >
            <Select.Trigger className="w-44">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All email states</Select.Item>
              <Select.Item value="scheduled">Scheduled</Select.Item>
              <Select.Item value="sending">Sending</Select.Item>
              <Select.Item value="sent">Sent</Select.Item>
              <Select.Item value="failed">Failed</Select.Item>
              <Select.Item value="cancelled">Cancelled</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Abandoned</Table.HeaderCell>
              <Table.HeaderCell>Cart</Table.HeaderCell>
              <Table.HeaderCell>Stage</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Outcome</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell>Loading abandoned carts…</Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            ) : null}
            {!isLoading && !data?.campaigns.length ? (
              <Table.Row>
                <Table.Cell>No abandoned carts found.</Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            ) : null}
            {data?.campaigns.map((campaign) => (
              <Table.Row key={campaign.id} className="cursor-pointer">
                <Table.Cell>
                  <Link
                    to={`/abandoned-carts/${campaign.id}`}
                    className="block"
                  >
                    <Text size="small" leading="compact" weight="plus">
                      {campaign.customer_name}
                    </Text>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {campaign.email} ·{" "}
                      {campaign.segment === "returning"
                        ? "Returning"
                        : "First-time"}
                    </Text>
                  </Link>
                </Table.Cell>
                <Table.Cell>{dateTime(campaign.abandoned_at)}</Table.Cell>
                <Table.Cell>
                  <Text size="small" leading="compact" weight="plus">
                    {money(campaign.cart_value, campaign.currency_code)}
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {campaign.item_count} item
                    {campaign.item_count === 1 ? "" : "s"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge>{campaign.checkout_stage}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={emailColor(campaign.last_email_status)}>
                    {campaign.last_email_status.replaceAll("_", " ")}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={statusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Showing {data?.campaigns.length ?? 0} of {data?.count ?? 0}
          </Text>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="secondary"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Button
              size="small"
              variant="secondary"
              disabled={offset + limit >= (data?.count ?? 0)}
              onClick={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Abandoned Carts",
  icon: ShoppingCart,
});
export default AbandonedCartsPage;
