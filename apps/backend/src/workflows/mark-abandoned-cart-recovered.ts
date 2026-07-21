import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { markAbandonedCartRecoveredStep } from "./steps/mark-abandoned-cart-recovered";

export const markAbandonedCartRecoveredWorkflow = createWorkflow(
  "mark-abandoned-cart-recovered-workflow",
  function (input: { order_id: string }) {
    const result = markAbandonedCartRecoveredStep(input);
    return new WorkflowResponse(result);
  },
);
