import type { CreateOrderDTO } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { createOrderWorkflow } from "@medusajs/medusa/core-flows"

type Input = {
  source_order_id: string
  created_at: string
  order: CreateOrderDTO
}

export const createLegacyOrderStep = createStep(
  "create-legacy-order",
  async (input: Input, { container }) => {
    const { result } = await createOrderWorkflow(container).run({
      input: {
        ...input.order,
        no_notification: true,
        metadata: {
          ...(input.order.metadata || {}),
          legacy_source: "squarespace",
          legacy_order_id: input.source_order_id,
          legacy_created_at: input.created_at,
        },
      },
    })
    return new StepResponse(result, result.id)
  },
  async (orderId, { container }) => {
    if (orderId) {
      const orderModule = container.resolve(Modules.ORDER)
      await orderModule.deleteOrders(orderId)
    }
  }
)
