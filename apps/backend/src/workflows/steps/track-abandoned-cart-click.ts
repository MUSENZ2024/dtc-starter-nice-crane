import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { ABANDONED_CART_MODULE } from "../../modules/abandoned-cart";
import AbandonedCartModuleService from "../../modules/abandoned-cart/service";

export const trackAbandonedCartClickStep = createStep(
  "track-abandoned-cart-click",
  async (
    { cart_id, tracking_token }: { cart_id: string; tracking_token: string },
    { container },
  ) => {
    const service: AbandonedCartModuleService = container.resolve(
      ABANDONED_CART_MODULE,
    );
    const events = await service.listAbandonedCartEmailEvents(
      { tracking_token },
      { take: 1 },
    );
    const event = events[0];
    if (!event || event.cart_id !== cart_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Recovery link was not found.",
      );
    }
    const campaign = await service.retrieveAbandonedCartCampaign(
      event.campaign_id,
    );
    const now = new Date();
    await service.updateAbandonedCartEmailEvents({
      id: event.id,
      clicked_at: event.clicked_at || now,
    });
    await service.updateAbandonedCartCampaigns({
      id: campaign.id,
      clicked_at: campaign.clicked_at || now,
    });
    return new StepResponse({ tracked: true });
  },
);
