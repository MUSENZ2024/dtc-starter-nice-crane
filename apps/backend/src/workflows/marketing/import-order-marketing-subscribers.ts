import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  importOrderMarketingSubscribersStep,
  type ImportOrderMarketingSubscribersInput,
} from "../steps/marketing/import-order-marketing-subscribers"

export const importOrderMarketingSubscribersWorkflow = createWorkflow(
  "import-order-marketing-subscribers-workflow",
  function (input: ImportOrderMarketingSubscribersInput) {
    return new WorkflowResponse(importOrderMarketingSubscribersStep(input))
  },
)
