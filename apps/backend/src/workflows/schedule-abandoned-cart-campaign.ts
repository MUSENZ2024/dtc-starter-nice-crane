import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  scheduleAbandonedCartCampaignStep,
  type ScheduleAbandonedCartCampaignInput,
} from "./steps/schedule-abandoned-cart-campaign";

export const scheduleAbandonedCartCampaignWorkflow = createWorkflow(
  "schedule-abandoned-cart-campaign-workflow",
  function (input: ScheduleAbandonedCartCampaignInput) {
    const result = scheduleAbandonedCartCampaignStep(input);
    return new WorkflowResponse(result);
  },
);
