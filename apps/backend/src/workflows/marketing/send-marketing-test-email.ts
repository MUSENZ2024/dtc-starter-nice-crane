import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { sendMarketingTestEmailStep } from "../steps/marketing/send-marketing-test-email"
export const sendMarketingTestEmailWorkflow = createWorkflow("send-marketing-test-email-workflow", function (input: { event_id: string; to: string; confirmation: string }) { return new WorkflowResponse(sendMarketingTestEmailStep(input)) })
