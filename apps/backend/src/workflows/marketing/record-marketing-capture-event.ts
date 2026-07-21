import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { recordMarketingCaptureEventStep, type RecordMarketingCaptureEventInput } from "../steps/marketing/record-marketing-capture-event"

export const recordMarketingCaptureEventWorkflow = createWorkflow(
  "record-marketing-capture-event-workflow",
  function (input: RecordMarketingCaptureEventInput) {
    const result = recordMarketingCaptureEventStep(input)
    return new WorkflowResponse(result)
  },
)
