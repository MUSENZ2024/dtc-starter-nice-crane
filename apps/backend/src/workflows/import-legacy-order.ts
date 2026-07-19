import type { CreateOrderDTO } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createOrdersStep } from "@medusajs/medusa/core-flows"
import { assertLegacyOrderMissingStep } from "./steps/assert-legacy-order-missing"
import { backdateLegacyOrderStep } from "./steps/backdate-legacy-order"

export type ImportLegacyOrderWorkflowInput = {
  source_order_id: string
  created_at: string
  order: CreateOrderDTO
}

export const importLegacyOrderWorkflow = createWorkflow(
  "import-legacy-order",
  function (input: ImportLegacyOrderWorkflowInput) {
    assertLegacyOrderMissingStep({ source_order_id: input.source_order_id })

    const ordersInput = transform({ input }, ({ input }) => [
      {
        ...input.order,
        no_notification: true,
        metadata: {
          ...(input.order.metadata || {}),
          legacy_source: "squarespace",
          legacy_order_id: input.source_order_id,
          legacy_created_at: input.created_at,
        },
      },
    ])
    const orders = createOrdersStep(ordersInput)
    const backdateInput = transform({ orders, input }, ({ orders, input }) => ({
      order_id: orders[0].id,
      created_at: input.created_at,
    }))
    backdateLegacyOrderStep(backdateInput)

    return new WorkflowResponse(
      transform({ orders }, ({ orders }) => orders[0])
    )
  }
)
