import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { manageMarketingCampaignStep } from "../steps/marketing/manage-marketing-campaign"
export const manageMarketingCampaignWorkflow = createWorkflow("manage-marketing-campaign", function (input: { campaign_id: string; action: "pause" | "resume" | "cancel" }) { return new WorkflowResponse(manageMarketingCampaignStep(input)) })
