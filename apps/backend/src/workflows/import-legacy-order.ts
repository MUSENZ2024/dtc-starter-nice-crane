import type { CreateOrderDTO } from "@medusajs/framework/types"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createLegacyOrderStep } from "./steps/create-legacy-order"

export type ImportLegacyOrderWorkflowInput = {
  source_order_id: string
  created_at: string
  order: CreateOrderDTO
}

export const importLegacyOrderWorkflow = createWorkflow(
  "import-legacy-order",
  function (input: ImportLegacyOrderWorkflowInput) {
    const order = createLegacyOrderStep(input)
    return new WorkflowResponse(order)
  }
)
