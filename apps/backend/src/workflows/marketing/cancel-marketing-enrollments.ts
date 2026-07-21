import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { cancelMarketingEnrollmentsStep } from "../steps/marketing/cancel-marketing-enrollments"
export const cancelMarketingEnrollmentsWorkflow = createWorkflow("cancel-marketing-enrollments-workflow", function (input: { subscriber_id: string; reason: "purchased" | "unsubscribed" | "suppressed"; order_id?: string }) { return new WorkflowResponse(cancelMarketingEnrollmentsStep(input)) })
