import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { ABANDONED_CART_MODULE } from "../../../../../../../modules/abandoned-cart";
import AbandonedCartModuleService from "../../../../../../../modules/abandoned-cart/service";
import {
  renderAbandonedCartEmail,
  type AbandonedCartSequenceNumber,
  type AbandonedCartSnapshot,
} from "../../../../../../../lib/abandoned-cart-email";

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const service: AbandonedCartModuleService = req.scope.resolve(
    ABANDONED_CART_MODULE,
  );
  const event = await service
    .retrieveAbandonedCartEmailEvent(req.params.eventId)
    .catch(() => null);
  const campaign = await service
    .retrieveAbandonedCartCampaign(req.params.id)
    .catch(() => null);
  if (!event || !campaign || event.campaign_id !== campaign.id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Email preview was not found.",
    );
  }
  const html = await renderAbandonedCartEmail(
    campaign.snapshot as AbandonedCartSnapshot,
    event.sequence_number as AbandonedCartSequenceNumber,
    event.tracking_token,
  );
  res.json({
    html,
    subject: event.subject,
    sequence_number: event.sequence_number,
    status: event.status,
  });
}
