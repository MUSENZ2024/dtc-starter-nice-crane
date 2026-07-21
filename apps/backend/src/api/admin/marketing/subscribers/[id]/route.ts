import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { data } = await query.graph({
    entity: "marketing_subscriber",
    fields: [
      "id", "email", "email_normalized", "customer_id", "first_name", "last_name", "status",
      "customer_type", "primary_preference", "source_first", "source_latest",
      "subscribed_at", "unsubscribed_at", "suppression_reason", "order_count",
      "lifetime_revenue", "created_at", "updated_at", "consent_events.*",
      "preference_events.*", "enrollments.*", "enrollments.flow.*",
      "email_events.id", "email_events.enrollment_id", "email_events.flow_step_id",
      "email_events.template_key", "email_events.subject_snapshot", "email_events.preview_text_snapshot",
      "email_events.status", "email_events.scheduled_at", "email_events.sent_at",
      "email_events.delivered_at", "email_events.first_opened_at", "email_events.first_clicked_at",
      "email_events.failed_at", "email_events.cancelled_at", "email_events.attempt_count", "email_events.last_error",
      "offer_issuances.id", "offer_issuances.offer_id", "offer_issuances.code", "offer_issuances.status",
      "offer_issuances.issued_at", "offer_issuances.expires_at", "offer_issuances.redeemed_at",
      "offer_issuances.redeemed_order_id", "offer_issuances.discount_amount_realized", "offer_issuances.currency_code",
    ],
    filters: { id: req.params.id },
  })
  if (!data[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Marketing subscriber not found")
  }
  const subscriber = data[0]
  const { data: orders } = await query.graph({
    entity: "orders",
    fields: ["id", "display_id", "email", "status", "created_at", "total", "currency_code"],
    filters: { email: subscriber.email_normalized },
    pagination: { take: 100, order: { created_at: "DESC" } },
  })
  res.status(200).json({ subscriber, orders })
}
