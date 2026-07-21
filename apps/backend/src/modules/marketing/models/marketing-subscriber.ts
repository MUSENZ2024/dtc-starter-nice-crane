import { model } from "@medusajs/framework/utils"
import MarketingConsentEvent from "./marketing-consent-event"
import MarketingPreferenceEvent from "./marketing-preference-event"
import MarketingOfferIssuance from "./marketing-offer-issuance"
import MarketingEnrollment from "./marketing-enrollment"
import MarketingEmailEvent from "./marketing-email-event"
import MarketingAttributionEvent from "./marketing-attribution-event"
import MarketingCampaignRecipient from "./marketing-campaign-recipient"
import {
  MARKETING_CUSTOMER_TYPES,
  MARKETING_PREFERENCES,
  MARKETING_SUBSCRIBER_STATUSES,
} from "../types"

const MarketingSubscriber = model
  .define("marketing_subscriber", {
    id: model.id().primaryKey(),
    email: model.text(),
    email_normalized: model.text(),
    customer_id: model.text().nullable(),
    first_name: model.text().nullable(),
    last_name: model.text().nullable(),
    status: model.enum([...MARKETING_SUBSCRIBER_STATUSES]).default("subscribed"),
    customer_type: model.enum([...MARKETING_CUSTOMER_TYPES]).default("unknown"),
    primary_preference: model.enum([...MARKETING_PREFERENCES]).default("everything"),
    source_first: model.text(),
    source_latest: model.text(),
    subscribed_at: model.dateTime(),
    unsubscribed_at: model.dateTime().nullable(),
    suppressed_at: model.dateTime().nullable(),
    suppression_reason: model.text().nullable(),
    last_email_sent_at: model.dateTime().nullable(),
    last_engaged_at: model.dateTime().nullable(),
    order_count: model.number().default(0),
    lifetime_revenue: model.bigNumber().default(0),
    metadata: model.json().nullable(),
    consent_events: model.hasMany(() => MarketingConsentEvent, {
      mappedBy: "subscriber",
    }),
    preference_events: model.hasMany(() => MarketingPreferenceEvent, {
      mappedBy: "subscriber",
    }),
    offer_issuances: model.hasMany(() => MarketingOfferIssuance, {
      mappedBy: "subscriber",
    }),
    enrollments: model.hasMany(() => MarketingEnrollment, { mappedBy: "subscriber" }),
    email_events: model.hasMany(() => MarketingEmailEvent, { mappedBy: "subscriber" }),
    attribution_events: model.hasMany(() => MarketingAttributionEvent, { mappedBy: "subscriber" }),
    campaign_recipients: model.hasMany(() => MarketingCampaignRecipient, { mappedBy: "subscriber" }),
  })
  .indexes([
    { on: ["email_normalized"], unique: true },
    { on: ["customer_id"] },
    { on: ["status"] },
    { on: ["primary_preference"] },
    { on: ["subscribed_at"] },
    { on: ["last_engaged_at"] },
  ])

export default MarketingSubscriber
