import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  subscribeMarketingProfileStep,
  type SubscribeMarketingProfileInput,
} from "../steps/marketing/subscribe-marketing-profile"
import { issueWelcomeOfferStep } from "../steps/marketing/issue-welcome-offer"
import { enrollWelcomeFlowStep } from "../steps/marketing/enroll-welcome-flow"

export const subscribeMarketingProfileWorkflow = createWorkflow(
  "subscribe-marketing-profile-workflow",
  function (input: SubscribeMarketingProfileInput) {
    const result = subscribeMarketingProfileStep(input)
    const offer = issueWelcomeOfferStep({ subscriber_id: result.subscriber_id })
    enrollWelcomeFlowStep({ subscriber_id: result.subscriber_id, issue_result: offer })
    return new WorkflowResponse(result)
  },
)
