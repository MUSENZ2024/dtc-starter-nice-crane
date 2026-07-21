import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { saveMarketingSegmentStep, type SaveSegmentInput } from "../steps/marketing/save-marketing-segment"
export const saveMarketingSegmentWorkflow = createWorkflow("save-marketing-segment", function (input: SaveSegmentInput) { return new WorkflowResponse(saveMarketingSegmentStep(input)) })
