import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createDefaultWelcomeOfferStep } from "../steps/marketing/create-default-welcome-offer"

export const createDefaultWelcomeOfferWorkflow = createWorkflow(
  "create-default-welcome-offer-workflow",
  function () { return new WorkflowResponse(createDefaultWelcomeOfferStep()) },
)
