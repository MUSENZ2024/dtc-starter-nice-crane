import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  updateEmailTemplateStep,
  type UpdateEmailTemplateInput,
} from "./steps/update-email-template"

export const updateEmailTemplateWorkflow = createWorkflow(
  "update-email-template-workflow",
  function (input: UpdateEmailTemplateInput) {
    const template = updateEmailTemplateStep(input)

    return new WorkflowResponse(template)
  }
)
