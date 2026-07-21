import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateMarketingControlStep } from "../steps/marketing/update-marketing-control"
export const updateMarketingControlWorkflow = createWorkflow("update-marketing-control", function (input: { global_pause: boolean; updated_by?: string | null }) { return new WorkflowResponse(updateMarketingControlStep(input)) })
