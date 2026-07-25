import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { ABANDONED_CART_MODULE } from "../../../../modules/abandoned-cart";
import AbandonedCartModuleService from "../../../../modules/abandoned-cart/service";
import { resolveLineItemImage } from "../../../../lib/resolve-line-item-image";

const numeric = (value: unknown) => {
  if (value && typeof value === "object" && "numeric_" in value)
    return Number((value as { numeric_: unknown }).numeric_) || 0;
  return Number(value) || 0;
};

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const service: AbandonedCartModuleService = req.scope.resolve(
    ABANDONED_CART_MODULE,
  );
  const query = req.scope.resolve("query");
  const campaign = await service
    .retrieveAbandonedCartCampaign(req.params.id)
    .catch(() => null);
  if (!campaign)
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Abandoned cart was not found.",
    );

  const events = await service.listAbandonedCartEmailEvents(
    { campaign_id: campaign.id },
    { order: { sequence_number: "ASC" } },
  );
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "customer_id",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "discount_total",
      "shipping_total",
      "created_at",
      "updated_at",
      "completed_at",
      "metadata",
      "items.id",
      "items.product_title",
      "items.variant_title",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.thumbnail",
      "items.product_id",
      "items.variant_id",
      "items.variant.images.url",
      "items.variant.product.thumbnail",
      "shipping_address.*",
      "billing_address.*",
      "shipping_methods.id",
      "shipping_methods.name",
      "shipping_methods.amount",
      "payment_collection.id",
      "payment_collection.status",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.status",
    ],
    filters: { id: campaign.cart_id },
  });
  const orderFilters = campaign.customer_id
    ? { customer_id: campaign.customer_id }
    : { email: campaign.email };
  const { data: orders, metadata: orderMetadata } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "total",
      "currency_code",
      "status",
      "payment_status",
      "fulfillment_status",
    ],
    filters: orderFilters,
    pagination: { take: 20, skip: 0, order: { created_at: "DESC" } },
  });

  res.json({
    campaign: {
      ...campaign,
      cart_value: numeric(campaign.cart_value),
      free_shipping_remaining: numeric(campaign.free_shipping_remaining),
      recovered_revenue:
        campaign.recovered_revenue == null
          ? null
          : numeric(campaign.recovered_revenue),
    },
    events,
    cart: carts[0]
      ? {
          ...carts[0],
          items: (carts[0].items || []).map((item: any) => ({
            ...item,
            thumbnail: resolveLineItemImage(item),
          })),
        }
      : null,
    customer_orders: orders.map((order) => ({
      ...order,
      total: numeric(order.total),
    })),
    customer_order_count: orderMetadata?.count || 0,
    customer_lifetime_value: orders.reduce(
      (sum, order) => sum + numeric(order.total),
      0,
    ),
  });
}
