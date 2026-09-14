import { emitEventStep } from "@medusajs/medusa/core-flows"
import { FulfillmentWorkflowEvents } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse
} from "@medusajs/framework/workflows-sdk"
import {
  attachTrackingToShippedFulfillmentStep,
  AttachTrackingToShippedFulfillmentInput
} from "./steps/attach-tracking-to-shipped-fulfillment"

export const attachTrackingToShippedFulfillmentWorkflow = createWorkflow(
  "attach-tracking-to-shipped-fulfillment-workflow",
  function (input: AttachTrackingToShippedFulfillmentInput) {
    const fulfillment = attachTrackingToShippedFulfillmentStep(input)
    const eventData = transform(
      { fulfillment, input },
      ({ fulfillment, input }) => ({
        id: fulfillment.id,
        no_notification: !input.send_notification
      })
    )

    emitEventStep({
      eventName: FulfillmentWorkflowEvents.SHIPMENT_CREATED,
      data: eventData
    })

    return new WorkflowResponse(fulfillment)
  }
)
