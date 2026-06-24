import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  queueOrderConfirmationEmailStep,
  type QueueOrderConfirmationEmailInput,
} from "./steps/queue-order-confirmation-email"

export const queueOrderConfirmationEmailWorkflow = createWorkflow(
  "queue-order-confirmation-email-workflow",
  function (input: QueueOrderConfirmationEmailInput) {
    const result = queueOrderConfirmationEmailStep(input)

    return new WorkflowResponse(result)
  }
)
