import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"

type Status = "draft" | "active" | "paused" | "archived"
export const updateMarketingFlowStatusStep = createStep("update-marketing-flow-status", async ({ id, status }: { id: string; status: Status }, { container }) => {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const previous = await service.retrieveMarketingFlow(id)
  const flow = await service.updateMarketingFlows({ id, status, activated_at: status === "active" ? new Date() : previous.activated_at })
  return new StepResponse({ flow }, { id, status: previous.status, activated_at: previous.activated_at })
}, async (data: { id: string; status: Status; activated_at?: Date | null } | undefined, { container }) => {
  if (!data) return
  await (container.resolve(MARKETING_MODULE) as MarketingModuleService).updateMarketingFlows(data)
})
