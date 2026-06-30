import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { updateCustomerEmailStep } from "./steps/update-customer-email"

type Input = { customerId: string; currentEmail: string; newEmail: string }

export const updateCustomerEmailWorkflow = createWorkflow(
  "update-customer-email-workflow",
  function (input: Input) {
    const customer = updateCustomerEmailStep(input)
    return new WorkflowResponse({ customer })
  }
)
