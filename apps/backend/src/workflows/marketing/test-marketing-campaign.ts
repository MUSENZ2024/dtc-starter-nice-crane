import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { testMarketingCampaignStep } from "../steps/marketing/test-marketing-campaign"
export const testMarketingCampaignWorkflow = createWorkflow("test-marketing-campaign", function (input: { campaign_id: string; to: string; confirmation: string }) { return new WorkflowResponse(testMarketingCampaignStep(input)) })
