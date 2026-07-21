import { MedusaService } from "@medusajs/framework/utils";
import AbandonedCartCampaign from "./models/abandoned-cart-campaign";
import AbandonedCartEmailEvent from "./models/abandoned-cart-email-event";

class AbandonedCartModuleService extends MedusaService({
  AbandonedCartCampaign,
  AbandonedCartEmailEvent,
}) {}

export default AbandonedCartModuleService;
