import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  unsubscribeMarketingProfileStep,
  type UnsubscribeMarketingProfileInput,
} from "../steps/marketing/unsubscribe-marketing-profile"
import { cancelMarketingEnrollmentsStep } from "../steps/marketing/cancel-marketing-enrollments"

export const unsubscribeMarketingProfileWorkflow = createWorkflow(
  "unsubscribe-marketing-profile-workflow",
  function (input: UnsubscribeMarketingProfileInput) {
    const result = unsubscribeMarketingProfileStep(input)
    cancelMarketingEnrollmentsStep({ subscriber_id: result.subscriber_id, reason: "unsubscribed", dependency: result })
    return new WorkflowResponse(result)
  },
)
