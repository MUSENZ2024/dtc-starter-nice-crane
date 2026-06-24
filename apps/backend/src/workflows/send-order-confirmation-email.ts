import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  sendOrderConfirmationEmailStep,
  type SendOrderConfirmationEmailInput,
} from "./steps/send-order-confirmation-email"

export const sendOrderConfirmationEmailWorkflow = createWorkflow(
  "send-order-confirmation-email-workflow",
  function (input: SendOrderConfirmationEmailInput) {
    const email = sendOrderConfirmationEmailStep(input)

    return new WorkflowResponse(email)
  }
)
