import type { IFulfillmentModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type AttachTrackingToShippedFulfillmentInput = {
  order_id: string
  fulfillment_id: string
  tracking_number: string
  tracking_url?: string
  send_notification: boolean
}

type CompensationInput = {
  fulfillment_id: string
  label_ids: string[]
}

type OrderWithFulfillments = {
  id: string
  fulfillments?: { id: string }[] | null
}

export const attachTrackingToShippedFulfillmentStep = createStep(
  "attach-tracking-to-shipped-fulfillment",
  async (input: AttachTrackingToShippedFulfillmentInput, { container }) => {
    const query = container.resolve("query")
    const fulfillmentService: IFulfillmentModuleService = container.resolve(
      Modules.FULFILLMENT
    )

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "fulfillments.id"],
      filters: { id: input.order_id }
    })

    const order = orders[0] as OrderWithFulfillments | undefined

    if (!order) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found.")
    }

    if (!order.fulfillments?.some(({ id }) => id === input.fulfillment_id)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Fulfillment not found on this order."
      )
    }

    const fulfillment = await fulfillmentService.retrieveFulfillment(
      input.fulfillment_id,
      { relations: ["labels"] }
    )

    if (fulfillment.canceled_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Tracking cannot be added to a canceled fulfillment."
      )
    }

    if (!fulfillment.shipped_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This recovery action is only for fulfillments already marked as shipped."
      )
    }

    if (fulfillment.labels.some((label) => label.tracking_number.trim())) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This fulfillment already has a tracking number."
      )
    }

    const trackingNumber = input.tracking_number.trim()
    const trackingUrl =
      input.tracking_url?.trim() ||
      `https://musenz.com/track?number=${encodeURIComponent(trackingNumber)}`
    const labelIds = fulfillment.labels.map(({ id }) => id)

    const updated = await fulfillmentService.updateFulfillment(
      input.fulfillment_id,
      {
        labels: [
          ...labelIds.map((id) => ({ id })),
          {
            tracking_number: trackingNumber,
            tracking_url: trackingUrl,
            label_url: "#"
          }
        ]
      }
    )

    return new StepResponse(updated, {
      fulfillment_id: input.fulfillment_id,
      label_ids: labelIds
    } satisfies CompensationInput)
  },
  async (input: CompensationInput | undefined, { container }) => {
    if (!input) {
      return
    }

    const fulfillmentService: IFulfillmentModuleService = container.resolve(
      Modules.FULFILLMENT
    )

    await fulfillmentService.updateFulfillment(input.fulfillment_id, {
      labels: input.label_ids.map((id) => ({ id }))
    })
  }
)
