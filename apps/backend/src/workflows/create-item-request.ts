import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { createItemRequestStep, CreateItemRequestInput } from "./steps/create-item-request"

export const createItemRequestWorkflow = createWorkflow(
  "create-item-request-workflow",
  function (input: CreateItemRequestInput) {
    const request = createItemRequestStep(input)
    return new WorkflowResponse({ request })
  }
)
