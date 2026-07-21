import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { manageMarketingEmailEventStep } from "../steps/marketing/manage-marketing-email-event"
export const manageMarketingEmailEventWorkflow = createWorkflow("manage-marketing-email-event-workflow", function (input: { id: string; action: "retry" | "resend" | "cancel"; confirmation: string }) { return new WorkflowResponse(manageMarketingEmailEventStep(input)) })
