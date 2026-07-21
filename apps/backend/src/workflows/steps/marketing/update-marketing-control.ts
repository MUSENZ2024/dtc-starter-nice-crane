import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
export const updateMarketingControlStep = createStep("update-marketing-control", async (input: { global_pause: boolean; updated_by?: string | null }, { container }) => {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const [control] = await service.listMarketingControls({ key: "global" }, { take: 1 })
  const result = control ? await service.updateMarketingControls({ id: control.id, ...input }) : await service.createMarketingControls({ key: "global", global_pause: input.global_pause, monthly_safety_limit: 9000, daily_dispatch_cap: 1350, frequency_days: 3, updated_by: input.updated_by || null })
  return new StepResponse(result)
})
