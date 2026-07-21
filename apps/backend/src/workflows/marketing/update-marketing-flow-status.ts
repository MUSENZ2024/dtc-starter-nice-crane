import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateMarketingFlowStatusStep } from "../steps/marketing/update-marketing-flow-status"
export const updateMarketingFlowStatusWorkflow = createWorkflow("update-marketing-flow-status-workflow", function (input: { id: string; status: "draft" | "active" | "paused" | "archived" }) { return new WorkflowResponse(updateMarketingFlowStatusStep(input)) })
