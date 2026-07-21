import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { suppressMarketingSubscriberStep } from "../steps/marketing/suppress-marketing-subscriber"
export const suppressMarketingSubscriberWorkflow = createWorkflow("suppress-marketing-subscriber-workflow", function (input: { id: string; reason: string; confirmation: string }) { return new WorkflowResponse(suppressMarketingSubscriberStep(input)) })
