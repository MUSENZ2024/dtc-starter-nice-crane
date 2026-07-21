import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { issueWelcomeOfferStep, type IssueWelcomeOfferInput } from "../steps/marketing/issue-welcome-offer"

export const issueWelcomeOfferWorkflow = createWorkflow(
  "issue-welcome-offer-workflow",
  function (input: IssueWelcomeOfferInput) {
    return new WorkflowResponse(issueWelcomeOfferStep(input))
  },
)
