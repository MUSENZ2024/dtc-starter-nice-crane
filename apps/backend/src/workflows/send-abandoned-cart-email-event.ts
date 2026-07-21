import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateCartsStep } from "@medusajs/medusa/core-flows";
import { sendAbandonedCartEmailEventStep } from "./steps/send-abandoned-cart-email-event";

export const sendAbandonedCartEmailEventWorkflow = createWorkflow(
  "send-abandoned-cart-email-event-workflow",
  function (input: { event_id: string }) {
    const result = sendAbandonedCartEmailEventStep(input);
    when({ result }, ({ result }) => result.sent).then(() => {
      const cartUpdate = transform({ result }, ({ result }) => [
        {
          id: result.cart_id,
          metadata: {
            ...result.cart_metadata,
            abandoned_cart_id: result.cart_id,
            abandoned_cart_campaign_id: result.campaign_id,
          },
        },
      ]);
      updateCartsStep(cartUpdate);
    });
    return new WorkflowResponse(result);
  },
);
