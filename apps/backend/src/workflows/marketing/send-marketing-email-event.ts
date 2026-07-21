import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { sendMarketingEmailEventStep } from "../steps/marketing/send-marketing-email-event"
export const sendMarketingEmailEventWorkflow = createWorkflow("send-marketing-email-event-workflow", function (input: { event_id: string }) { return new WorkflowResponse(sendMarketingEmailEventStep(input)) })
