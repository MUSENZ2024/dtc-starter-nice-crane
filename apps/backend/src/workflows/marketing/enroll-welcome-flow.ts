import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { enrollWelcomeFlowStep } from "../steps/marketing/enroll-welcome-flow"
export const enrollWelcomeFlowWorkflow = createWorkflow("enroll-welcome-flow-workflow", function (input: { subscriber_id: string }) { return new WorkflowResponse(enrollWelcomeFlowStep(input)) })
