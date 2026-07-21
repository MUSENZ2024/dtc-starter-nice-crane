import type { ExecArgs } from "@medusajs/framework/types"
import { createDefaultWelcomeOfferWorkflow } from "../workflows/marketing/create-default-welcome-offer"
import { updateMarketingOfferStatusWorkflow } from "../workflows/marketing/update-marketing-offer-status"
import { createDefaultWelcomeFlowWorkflow } from "../workflows/marketing/create-default-welcome-flow"
import { updateMarketingFlowStatusWorkflow } from "../workflows/marketing/update-marketing-flow-status"

export default async function setupWelcomeOffer({ container }: ExecArgs) {
  const flow = await createDefaultWelcomeFlowWorkflow(container).run()
  const requestedFlowStatus = process.env.MARKETING_SETUP_FLOW_STATUS
  const flowStatus = requestedFlowStatus === "active" || requestedFlowStatus === "paused" || requestedFlowStatus === "draft"
    ? (await updateMarketingFlowStatusWorkflow(container).run({ input: { id: flow.result.flow.id, status: requestedFlowStatus } })).result.flow.status
    : flow.result.flow.status
  const { result } = await createDefaultWelcomeOfferWorkflow(container).run()
  const requestedStatus = process.env.MARKETING_SETUP_OFFER_STATUS
  if (requestedStatus === "active" || requestedStatus === "paused" || requestedStatus === "draft") {
    const updated = await updateMarketingOfferStatusWorkflow(container).run({ input: { id: result.offer.id, status: requestedStatus } })
    console.log(`${result.created ? "Created" : "Found"} ${result.offer.key}; status is ${updated.result.offer.status}. ${flow.result.created ? "Created" : "Found"} ${flow.result.flow.key} in ${flowStatus} state.`)
  } else {
    console.log(`${result.created ? "Created" : "Found"} ${result.offer.key} in ${result.offer.status} state. ${flow.result.created ? "Created" : "Found"} ${flow.result.flow.key} in ${flowStatus} state.`)
  }
}
