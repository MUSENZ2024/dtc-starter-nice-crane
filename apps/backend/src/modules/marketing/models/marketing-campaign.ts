import { model } from "@medusajs/framework/utils"
import { MARKETING_CAMPAIGN_STATUSES } from "../types"
import MarketingCampaignRecipient from "./marketing-campaign-recipient"

const MarketingCampaign = model.define("marketing_campaign", {
  id: model.id().primaryKey(),
  name: model.text(),
  status: model.enum([...MARKETING_CAMPAIGN_STATUSES]).default("draft"),
  subject: model.text(),
  preview_text: model.text(),
  template_key: model.text().default("structured_campaign_v1"),
  content: model.json(),
  audience_definition: model.json(),
  audience_snapshot_count: model.number().default(0),
  excluded_snapshot_count: model.number().default(0),
  scheduled_at: model.dateTime().nullable(),
  started_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
  confirmed_at: model.dateTime().nullable(),
  test_sent_at: model.dateTime().nullable(),
  created_by: model.text().nullable(),
  utm_campaign: model.text(),
  sender: model.text().default("MUSE NZ <hello@musenz.com>"),
  metadata: model.json().nullable(),
  recipients: model.hasMany(() => MarketingCampaignRecipient, { mappedBy: "campaign" }),
}).indexes([{ on: ["status", "scheduled_at"] }, { on: ["utm_campaign"], unique: true }])

export default MarketingCampaign
