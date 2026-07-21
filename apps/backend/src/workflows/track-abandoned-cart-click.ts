import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { trackAbandonedCartClickStep } from "./steps/track-abandoned-cart-click";

export const trackAbandonedCartClickWorkflow = createWorkflow(
  "track-abandoned-cart-click-workflow",
  function (input: { cart_id: string; tracking_token: string }) {
    const result = trackAbandonedCartClickStep(input);
    return new WorkflowResponse(result);
  },
);
