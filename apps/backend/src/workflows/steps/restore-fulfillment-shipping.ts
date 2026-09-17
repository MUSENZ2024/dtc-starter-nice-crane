import type {
  FulfillmentDTO,
  IFulfillmentModuleService
} from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type RestoreFulfillmentShippingInput = {
  order_id: string
  fulfillment_id: string
}

type OrderWithFulfillments = {
  id: string
  fulfillments?: { id: string }[] | null
}

export const restoreFulfillmentShippingStep = createStep<
  RestoreFulfillmentShippingInput,
  FulfillmentDTO,
  string | null
>(
  "restore-fulfillment-shipping",
  async (input: RestoreFulfillmentShippingInput, { container }) => {
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
      input.fulfillment_id
    )
    if (fulfillment.canceled_at || fulfillment.delivered_at || fulfillment.shipped_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only an active, unshipped fulfillment can have shipping restored."
      )
    }

    if (fulfillment.requires_shipping) {
      return new StepResponse(fulfillment, null)
    }

    // Medusa's fulfillment model supports this field, but its public update DTO
    // omits it. The module service passes update data to the model unchanged.
    const updateShippingRequirement = fulfillmentService.updateFulfillment as unknown as (
      id: string,
      data: { requires_shipping: boolean }
    ) => Promise<FulfillmentDTO>
    const updated = await updateShippingRequirement(input.fulfillment_id, {
      requires_shipping: true
    })

    return new StepResponse(updated, input.fulfillment_id)
  },
  async (fulfillmentId: string | null | undefined, { container }) => {
    if (!fulfillmentId) {
      return
    }
    const fulfillmentService: IFulfillmentModuleService = container.resolve(
      Modules.FULFILLMENT
    )
    const updateShippingRequirement = fulfillmentService.updateFulfillment as unknown as (
      id: string,
      data: { requires_shipping: boolean }
    ) => Promise<FulfillmentDTO>
    await updateShippingRequirement(fulfillmentId, {
      requires_shipping: false
    })
  }
)
