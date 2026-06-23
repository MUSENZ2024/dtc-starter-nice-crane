import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { updateReviewStatusStep } from "./steps/update-review-status"

export const updateReviewStatusWorkflow = createWorkflow(
  "update-review-status-workflow",
  function (input: { id: string; status: "approved" | "rejected" }) {
    const review = updateReviewStatusStep(input)
    return new WorkflowResponse({ review })
  }
)
