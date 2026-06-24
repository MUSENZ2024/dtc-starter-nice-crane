import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import {
  attachSplitPayMetadataStep,
  AttachSplitPayMetadataInput,
} from "./steps/attach-split-pay-metadata"

export const attachSplitPayMetadataWorkflow = createWorkflow(
  "attach-split-pay-metadata-workflow",
  function (input: AttachSplitPayMetadataInput) {
    const order = attachSplitPayMetadataStep(input)
    return new WorkflowResponse({ order })
  }
)
