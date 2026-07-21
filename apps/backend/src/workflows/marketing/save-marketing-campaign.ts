import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { saveMarketingCampaignStep, type SaveCampaignInput } from "../steps/marketing/save-marketing-campaign"
export const saveMarketingCampaignWorkflow = createWorkflow("save-marketing-campaign", function (input: SaveCampaignInput) { return new WorkflowResponse(saveMarketingCampaignStep(input)) })
