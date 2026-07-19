import type { CreateOrderDTO } from "@medusajs/framework/types"
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { assertLegacyOrderMissingStep } from "./steps/assert-legacy-order-missing"
import { backdateLegacyOrderStep } from "./steps/backdate-legacy-order"
import { createLegacyOrderStep } from "./steps/create-legacy-order"

export type ImportLegacyOrderWorkflowInput = {
  source_order_id: string
  created_at: string
  order: CreateOrderDTO
}

export const importLegacyOrderWorkflow = createWorkflow(
  "import-legacy-order",
  function (input: ImportLegacyOrderWorkflowInput) {
    assertLegacyOrderMissingStep({ source_order_id: input.source_order_id })

    const order = createLegacyOrderStep(input)
    const backdateInput = transform({ order, input }, ({ order, input }) => ({
      order_id: order.id,
      created_at: input.created_at,
    }))
    backdateLegacyOrderStep(backdateInput)

    return new WorkflowResponse(order)
  }
)
