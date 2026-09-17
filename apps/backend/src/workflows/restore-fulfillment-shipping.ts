import {
  createWorkflow,
  WorkflowResponse
} from "@medusajs/framework/workflows-sdk"
import {
  restoreFulfillmentShippingStep,
  type RestoreFulfillmentShippingInput
} from "./steps/restore-fulfillment-shipping"

export const restoreFulfillmentShippingWorkflow = createWorkflow(
  "restore-fulfillment-shipping-workflow",
  function (input: RestoreFulfillmentShippingInput) {
    const fulfillment = restoreFulfillmentShippingStep(input)

    return new WorkflowResponse(fulfillment)
  }
)
