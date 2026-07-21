import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { scheduleMarketingCampaignStep, type ScheduleCampaignInput } from "../steps/marketing/schedule-marketing-campaign"
export const scheduleMarketingCampaignWorkflow = createWorkflow("schedule-marketing-campaign", function (input: ScheduleCampaignInput) { return new WorkflowResponse(scheduleMarketingCampaignStep(input)) })
