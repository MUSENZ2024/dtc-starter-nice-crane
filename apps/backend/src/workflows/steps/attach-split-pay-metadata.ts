import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export type AttachSplitPayMetadataInput = {
  order_id: string
  schedule_id: string
  subscription_id: string
  total_cents: number
  base_cents: number
  final_cents: number
  currency: string
}

/**
 * Stamps a freshly-placed order with the MUSE Pay metadata the order-placed
 * subscriber branches on (muse_split_pay) plus the Stripe schedule/subscription
 * IDs needed to render the payment schedule in the confirmation email and to
 * look the order up later from Stripe webhooks.
 *
 * Reads the order's current metadata first and merges rather than replaces it —
 * mirrors core-flows' updateOrdersStep, but resolves the Order module directly
 * since this is a narrow metadata-only write that doesn't need the full
 * updateOrderWorkflow order-change/email-validation machinery.
 */
export const attachSplitPayMetadataStep = createStep(
  "attach-split-pay-metadata",
  async (input: AttachSplitPayMetadataInput, { container }) => {
    const service = container.resolve(Modules.ORDER)

    const [existing] = await service.listOrders(
      { id: input.order_id },
      { select: ["id", "metadata"] }
    )
    if (!existing) {
      throw new Error(`Order ${input.order_id} not found.`)
    }
    const previousMetadata = existing.metadata ?? null

    const updated = await service.updateOrders(
      { id: input.order_id },
      {
        metadata: {
          ...existing.metadata,
          muse_split_pay: "true",
          split_pay_schedule_id: input.schedule_id,
          split_pay_subscription_id: input.subscription_id,
          split_pay_total_cents: input.total_cents,
          split_pay_base_cents: input.base_cents,
          split_pay_final_cents: input.final_cents,
          split_pay_currency: input.currency,
        },
      }
    )

    return new StepResponse(updated, { id: input.order_id, metadata: previousMetadata })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const service = container.resolve(Modules.ORDER)
    await service.updateOrders({ id: previous.id }, { metadata: previous.metadata })
  }
)
