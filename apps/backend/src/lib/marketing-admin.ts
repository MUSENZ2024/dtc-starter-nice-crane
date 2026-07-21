export const boundedInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 0), max) : fallback
}

export const subscriberFilters = (query: Record<string, unknown>) => {
  const filters: Record<string, unknown> = {}
  if (typeof query.q === "string" && query.q.trim()) filters.email_normalized = { $like: `%${query.q.trim().toLowerCase()}%` }
  for (const key of ["status", "primary_preference", "customer_type", "source_first"] as const) {
    if (typeof query[key] === "string" && query[key]) filters[key] = query[key]
  }
  if (query.has_purchased === "true") filters.order_count = { $gt: 0 }
  if (query.has_purchased === "false") filters.order_count = 0
  if (typeof query.subscribed_from === "string" || typeof query.subscribed_to === "string") {
    filters.subscribed_at = {
      ...(typeof query.subscribed_from === "string" ? { $gte: new Date(query.subscribed_from) } : {}),
      ...(typeof query.subscribed_to === "string" ? { $lte: new Date(query.subscribed_to) } : {}),
    }
  }
  return filters
}

export const safeEmailEvent = (event: any) => ({
  id: event.id, subscriber_id: event.subscriber_id, enrollment_id: event.enrollment_id,
  flow_step_id: event.flow_step_id, template_key: event.template_key,
  subject_snapshot: event.subject_snapshot, preview_text_snapshot: event.preview_text_snapshot,
  status: event.status, scheduled_at: event.scheduled_at, send_started_at: event.send_started_at,
  sent_at: event.sent_at, delivered_at: event.delivered_at, first_opened_at: event.first_opened_at,
  first_clicked_at: event.first_clicked_at, failed_at: event.failed_at, cancelled_at: event.cancelled_at,
  attempt_count: event.attempt_count, last_error: event.last_error,
  subscriber: event.subscriber ? { id: event.subscriber.id, email: event.subscriber.email, status: event.subscriber.status } : undefined,
  flow_step: event.flow_step ? { id: event.flow_step.id, name: event.flow_step.name, sequence_number: event.flow_step.sequence_number } : undefined,
})

export const csvCell = (value: unknown) => {
  const raw = String(value ?? "")
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}
