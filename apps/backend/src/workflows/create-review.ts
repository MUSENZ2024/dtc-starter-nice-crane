import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { createReviewStep, CreateReviewInput } from "./steps/create-review"

export const createReviewWorkflow = createWorkflow(
  "create-review-workflow",
  function (input: CreateReviewInput) {
    const review = createReviewStep(input)
    return new WorkflowResponse({ review })
  }
)
