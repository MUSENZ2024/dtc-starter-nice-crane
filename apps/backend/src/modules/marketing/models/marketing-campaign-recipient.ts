import { model } from "@medusajs/framework/utils"
import { MARKETING_CAMPAIGN_RECIPIENT_STATUSES } from "../types"
import MarketingCampaign from "./marketing-campaign"
import MarketingSubscriber from "./marketing-subscriber"

const MarketingCampaignRecipient = model.define("marketing_campaign_recipient", {
  id: model.id().primaryKey(),
  campaign: model.belongsTo(() => MarketingCampaign, { mappedBy: "recipients" }),
  subscriber: model.belongsTo(() => MarketingSubscriber, { mappedBy: "campaign_recipients" }),
  email: model.text(),
  status: model.enum([...MARKETING_CAMPAIGN_RECIPIENT_STATUSES]).default("eligible"),
  exclusion_reason: model.text().nullable(),
  email_event_id: model.text().nullable(),
}).indexes([{ on: ["campaign_id", "subscriber_id"], unique: true }, { on: ["campaign_id", "status"] }])

export default MarketingCampaignRecipient
