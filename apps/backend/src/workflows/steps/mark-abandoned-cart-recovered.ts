import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ABANDONED_CART_MODULE } from "../../modules/abandoned-cart";
import AbandonedCartModuleService from "../../modules/abandoned-cart/service";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "numeric_" in value)
    return Number((value as { numeric_: unknown }).numeric_) || 0;
  return Number(value) || 0;
}

export const markAbandonedCartRecoveredStep = createStep(
  "mark-abandoned-cart-recovered",
  async ({ order_id }: { order_id: string }, { container }) => {
    const query = container.resolve("query");
    const service: AbandonedCartModuleService = container.resolve(
      ABANDONED_CART_MODULE,
    );
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "total", "metadata"],
      filters: { id: order_id },
    });
    const order = orders[0];
    const campaignId = order?.metadata?.abandoned_cart_campaign_id;
    if (!order || typeof campaignId !== "string")
      return new StepResponse({ recovered: false });

    const campaign = await service
      .retrieveAbandonedCartCampaign(campaignId)
      .catch(() => null);
    if (!campaign || campaign.status === "recovered")
      return new StepResponse({ recovered: false });

    const now = new Date();
    await service.updateAbandonedCartCampaigns({
      id: campaign.id,
      status: "recovered",
      recovered_at: now,
      recovered_order_id: order.id,
      recovered_revenue: toNumber(order.total),
    });
    const pending = await service.listAbandonedCartEmailEvents({
      campaign_id: campaign.id,
      status: "scheduled",
    });
    if (pending.length) {
      await service.updateAbandonedCartEmailEvents(
        pending.map((event) => ({
          id: event.id,
          status: "cancelled" as const,
          cancelled_at: now,
        })),
      );
    }
    return new StepResponse({ recovered: true, campaign_id: campaign.id });
  },
);
