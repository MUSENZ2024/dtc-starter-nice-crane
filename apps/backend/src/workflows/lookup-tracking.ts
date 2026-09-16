import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";
import { lookupTrackingStep } from "./steps/lookup-tracking";

export const lookupTrackingWorkflow = createWorkflow(
  "lookup-tracking-workflow",
  function (input: { tracking_number: string }) {
    const result = lookupTrackingStep(input);
    return new WorkflowResponse(result);
  },
);
