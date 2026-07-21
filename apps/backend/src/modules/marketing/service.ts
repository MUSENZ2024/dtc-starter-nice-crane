import { MedusaService } from "@medusajs/framework/utils"
import MarketingConsentEvent from "./models/marketing-consent-event"
import MarketingPreferenceEvent from "./models/marketing-preference-event"
import MarketingSubscriber from "./models/marketing-subscriber"
import MarketingCaptureEvent from "./models/marketing-capture-event"
import MarketingOffer from "./models/marketing-offer"
import MarketingOfferIssuance from "./models/marketing-offer-issuance"
import MarketingFlow from "./models/marketing-flow"
import MarketingFlowStep from "./models/marketing-flow-step"
import MarketingEnrollment from "./models/marketing-enrollment"
import MarketingEmailEvent from "./models/marketing-email-event"
import MarketingAttributionEvent from "./models/marketing-attribution-event"
import MarketingSegment from "./models/marketing-segment"
import MarketingCampaign from "./models/marketing-campaign"
import MarketingCampaignRecipient from "./models/marketing-campaign-recipient"
import MarketingControl from "./models/marketing-control"

class MarketingModuleService extends MedusaService({
  MarketingSubscriber,
  MarketingConsentEvent,
  MarketingPreferenceEvent,
  MarketingCaptureEvent,
  MarketingOffer,
  MarketingOfferIssuance,
  MarketingFlow,
  MarketingFlowStep,
  MarketingEnrollment,
  MarketingEmailEvent,
  MarketingAttributionEvent,
  MarketingSegment,
  MarketingCampaign,
  MarketingCampaignRecipient,
  MarketingControl,
}) {}

export default MarketingModuleService
