import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { dispatchMarketingCampaignsStep } from "../steps/marketing/dispatch-marketing-campaigns"
export const dispatchMarketingCampaignsWorkflow = createWorkflow("dispatch-marketing-campaigns", function () { return new WorkflowResponse(dispatchMarketingCampaignsStep({})) })
