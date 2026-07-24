import { randomUUID } from "node:crypto";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ABANDONED_CART_MODULE } from "../../modules/abandoned-cart";
import AbandonedCartModuleService from "../../modules/abandoned-cart/service";
import {
  ABANDONED_CART_EMAILS,
  type AbandonedCartSnapshot,
} from "../../lib/abandoned-cart-email";

export type ScheduleAbandonedCartCampaignInput = {
  snapshot: AbandonedCartSnapshot;
};

const addHours = (value: string, hours: number) =>
  new Date(new Date(value).getTime() + hours * 60 * 60 * 1000);

export const scheduleAbandonedCartCampaignStep = createStep(
  "schedule-abandoned-cart-campaign",
  async ({ snapshot }: ScheduleAbandonedCartCampaignInput, { container }) => {
    const service: AbandonedCartModuleService = container.resolve(
      ABANDONED_CART_MODULE,
    );
    const existing = await service.listAbandonedCartCampaigns(
      { cart_id: snapshot.cart_id },
      { take: 1 },
    );

    if (existing[0]) {
      if (existing[0].status === "active") {
        const campaign = await service.updateAbandonedCartCampaigns({
          id: existing[0].id,
          email: snapshot.email,
          customer_name: snapshot.customer_name,
          customer_id: snapshot.customer_id,
          segment: snapshot.segment,
          checkout_stage: snapshot.checkout_stage,
          last_activity_at: new Date(snapshot.updated_at),
          currency_code: snapshot.currency_code,
          cart_value: snapshot.total,
          item_count: snapshot.item_count,
          free_shipping_qualified: snapshot.free_shipping_qualified,
          free_shipping_remaining: snapshot.free_shipping_remaining,
          snapshot,
        });
        return new StepResponse(
          { campaign, created: false },
          { id: campaign.id, created: false },
        );
      }
      return new StepResponse(
        { campaign: existing[0], created: false },
        { id: existing[0].id, created: false },
      );
    }

    const campaign = await service.createAbandonedCartCampaigns({
      cart_id: snapshot.cart_id,
      customer_id: snapshot.customer_id,
      email: snapshot.email,
      customer_name: snapshot.customer_name,
      segment: snapshot.segment,
      status: "active",
      checkout_stage: snapshot.checkout_stage,
      abandoned_at: new Date(snapshot.updated_at),
      last_activity_at: new Date(snapshot.updated_at),
      currency_code: snapshot.currency_code,
      cart_value: snapshot.total,
      item_count: snapshot.item_count,
      free_shipping_qualified: snapshot.free_shipping_qualified,
      free_shipping_remaining: snapshot.free_shipping_remaining,
      last_email_status: "scheduled",
      snapshot,
    });

    // The job only creates a campaign after the cart has already been inactive
    // for an hour. Schedule the sequence from detection time so an older cart
    // can't receive every overdue message in the same job run.
    const detectedAt = new Date().toISOString();
    const schedule = [
      { sequence: 1 as const, hours: 0 },
      { sequence: 2 as const, hours: 24 },
      { sequence: 3 as const, hours: 72 },
    ];
    await service.createAbandonedCartEmailEvents(
      schedule.map(({ sequence, hours }) => ({
        campaign_id: campaign.id,
        cart_id: snapshot.cart_id,
        sequence_number: sequence,
        template_key: ABANDONED_CART_EMAILS[sequence].templateKey,
        subject: ABANDONED_CART_EMAILS[sequence].subject,
        status: "scheduled" as const,
        scheduled_at: addHours(detectedAt, hours),
        tracking_token: randomUUID(),
      })),
    );

    return new StepResponse(
      { campaign, created: true },
      { id: campaign.id, created: true },
    );
  },
  async (compensation, { container }) => {
    if (!compensation?.created) return;
    const service: AbandonedCartModuleService = container.resolve(
      ABANDONED_CART_MODULE,
    );
    const events = await service.listAbandonedCartEmailEvents({
      campaign_id: compensation.id,
    });
    if (events.length)
      await service.deleteAbandonedCartEmailEvents(
        events.map((event) => event.id),
      );
    await service.deleteAbandonedCartCampaigns(compensation.id);
  },
);
