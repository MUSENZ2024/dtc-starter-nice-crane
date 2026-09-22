import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { updateItemRequestStep, UpdateItemRequestInput } from "./steps/update-item-request"

export const updateItemRequestWorkflow = createWorkflow(
  "update-item-request-workflow",
  function (input: UpdateItemRequestInput) {
    const request = updateItemRequestStep(input)
    return new WorkflowResponse({ request })
  }
)
