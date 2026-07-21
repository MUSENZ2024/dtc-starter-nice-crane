import { model } from "@medusajs/framework/utils"
import MarketingSubscriber from "./marketing-subscriber"
import { MARKETING_CONSENT_ACTIONS } from "../types"

const MarketingConsentEvent = model
  .define("marketing_consent_event", {
    id: model.id().primaryKey(),
    subscriber: model.belongsTo(() => MarketingSubscriber, {
      mappedBy: "consent_events",
    }),
    action: model.enum([...MARKETING_CONSENT_ACTIONS]),
    channel: model.enum(["email"] as const).default("email"),
    source: model.text(),
    consent_text: model.text(),
    privacy_policy_version: model.text(),
    occurred_at: model.dateTime(),
    ip_hash: model.text().nullable(),
    user_agent_summary: model.text().nullable(),
    country_code: model.text().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["subscriber_id"] },
    { on: ["action"] },
    { on: ["occurred_at"] },
  ])

export default MarketingConsentEvent
