import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { normalizeMarketingEmail } from "../../../lib/marketing-consent"

export type OrderMarketingSubscriberInput = {
  email: string
  first_name?: string | null
  last_name?: string | null
  customer_id?: string | null
  order_count: number
  lifetime_revenue: number
  first_order_at?: string | null
  last_order_at?: string | null
  order_sources: ("medusa" | "squarespace" | "unknown")[]
}

export type ImportOrderMarketingSubscribersInput = {
  import_id: string
  permission_basis: string
  subscribers: OrderMarketingSubscriberInput[]
}

type Compensation = {
  created_subscriber_ids: string[]
  created_consent_event_ids: string[]
  updated_subscribers: Record<string, unknown>[]
}

const cleanName = (value?: string | null) => value?.trim() || null

export const importOrderMarketingSubscribersStep = createStep(
  "import-order-marketing-subscribers",
  async (input: ImportOrderMarketingSubscribersInput, { container }) => {
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const seen = new Set<string>()
    const compensation: Compensation = {
      created_subscriber_ids: [],
      created_consent_event_ids: [],
      updated_subscribers: [],
    }
    const result = {
      created: 0,
      enriched: 0,
      unchanged: 0,
      preserved_unsubscribed: 0,
      preserved_suppressed: 0,
    }

    for (const contact of input.subscribers) {
      const emailNormalized = normalizeMarketingEmail(contact.email)
      if (seen.has(emailNormalized)) {
        throw new Error(`Duplicate normalized email in import batch: ${emailNormalized}`)
      }
      seen.add(emailNormalized)

      const [existing] = await service.listMarketingSubscribers(
        { email_normalized: emailNormalized },
        { take: 1 },
      )
      const firstName = cleanName(contact.first_name)
      const lastName = cleanName(contact.last_name)
      const metadata = {
        ...(existing?.metadata || {}),
        order_customer_import: {
          import_id: input.import_id,
          first_order_at: contact.first_order_at || null,
          last_order_at: contact.last_order_at || null,
          order_sources: [...new Set(contact.order_sources)].sort(),
        },
      }

      if (existing) {
        compensation.updated_subscribers.push({
          id: existing.id,
          email: existing.email,
          customer_id: existing.customer_id,
          first_name: existing.first_name,
          last_name: existing.last_name,
          customer_type: existing.customer_type,
          source_latest: existing.source_latest,
          order_count: existing.order_count,
          lifetime_revenue: existing.lifetime_revenue,
          metadata: existing.metadata,
        })
        const update = {
          id: existing.id,
          email: existing.email || contact.email.trim(),
          customer_id: existing.customer_id || contact.customer_id || null,
          first_name: existing.first_name || firstName,
          last_name: existing.last_name || lastName,
          customer_type: contact.order_count > 1 ? ("returning" as const) : ("first_time" as const),
          source_latest: "admin_import" as const,
          order_count: Math.max(existing.order_count || 0, contact.order_count),
          lifetime_revenue: Math.max(Number(existing.lifetime_revenue || 0), contact.lifetime_revenue),
          metadata,
        }
        await service.updateMarketingSubscribers(update)
        result.enriched += 1
        if (existing.status === "unsubscribed") result.preserved_unsubscribed += 1
        if (existing.status === "suppressed") result.preserved_suppressed += 1
        continue
      }

      const now = new Date()
      const subscriber = await service.createMarketingSubscribers({
        email: contact.email.trim(),
        email_normalized: emailNormalized,
        customer_id: contact.customer_id || null,
        first_name: firstName,
        last_name: lastName,
        status: "subscribed",
        customer_type: contact.order_count > 1 ? "returning" : "first_time",
        primary_preference: "everything",
        source_first: "admin_import",
        source_latest: "admin_import",
        subscribed_at: now,
        order_count: contact.order_count,
        lifetime_revenue: contact.lifetime_revenue,
        metadata,
      })
      compensation.created_subscriber_ids.push(subscriber.id)
      const consentEvent = await service.createMarketingConsentEvents({
        subscriber_id: subscriber.id,
        action: "subscribed",
        channel: "email",
        source: "admin_import",
        consent_text: input.permission_basis,
        privacy_policy_version: "admin-order-customer-permission",
        occurred_at: now,
        ip_hash: null,
        user_agent_summary: "authenticated admin import",
        country_code: null,
        metadata: { import_id: input.import_id, permission_basis: input.permission_basis },
      })
      compensation.created_consent_event_ids.push(consentEvent.id)
      result.created += 1
    }

    return new StepResponse(result, compensation)
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation) return
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    for (const id of compensation.created_consent_event_ids.reverse()) {
      await service.deleteMarketingConsentEvents(id)
    }
    for (const id of compensation.created_subscriber_ids.reverse()) {
      await service.deleteMarketingSubscribers(id)
    }
    for (const snapshot of compensation.updated_subscribers.reverse()) {
      await service.updateMarketingSubscribers(snapshot as any)
    }
  },
)
