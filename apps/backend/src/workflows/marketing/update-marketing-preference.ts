import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  updateMarketingPreferenceStep,
  type UpdateMarketingPreferenceInput,
} from "../steps/marketing/update-marketing-preference"

export const updateMarketingPreferenceWorkflow = createWorkflow(
  "update-marketing-preference-workflow",
  function (input: UpdateMarketingPreferenceInput) {
    const result = updateMarketingPreferenceStep(input)
    return new WorkflowResponse(result)
  },
)
