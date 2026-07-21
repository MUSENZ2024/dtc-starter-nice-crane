import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createDefaultWelcomeFlowStep } from "../steps/marketing/create-default-welcome-flow"
export const createDefaultWelcomeFlowWorkflow = createWorkflow("create-default-welcome-flow-workflow", function () { return new WorkflowResponse(createDefaultWelcomeFlowStep()) })
