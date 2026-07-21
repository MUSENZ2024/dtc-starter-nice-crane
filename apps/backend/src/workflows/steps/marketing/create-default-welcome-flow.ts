import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import { WELCOME_FLOW_KEY, WELCOME_FLOW_STEPS } from "../../../modules/marketing/welcome-flow"

export const createDefaultWelcomeFlowStep = createStep("create-default-welcome-flow", async (_, { container }) => {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const [existing] = await service.listMarketingFlows({ key: WELCOME_FLOW_KEY }, { take: 1 })
  if (existing) return new StepResponse({ flow: existing, created: false }, {})
  const flow = await service.createMarketingFlows({ key: WELCOME_FLOW_KEY, name: "First-time welcome", type: "welcome", status: "draft", version: 1, entry_rules: { customer_type: "first_time", requires_active_offer: true }, exit_rules: { on_purchase: true, on_unsubscribe: true, on_suppression: true }, frequency_rules: { max_emails: 5, window_days: 5 }, metadata: { seeded: true } })
  const steps = await service.createMarketingFlowSteps(WELCOME_FLOW_STEPS.map((step) => ({ ...step, flow_id: flow.id, status: "active" as const, audience_rules: step.sequence_number === 3 ? { preference_variant: true } : null })))
  return new StepResponse({ flow, steps, created: true }, { flow_id: flow.id, step_ids: steps.map((step) => step.id) })
}, async (data: { flow_id?: string; step_ids?: string[] } | undefined, { container }) => {
  if (!data?.flow_id) return
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  if (data.step_ids?.length) await service.deleteMarketingFlowSteps(data.step_ids)
  await service.deleteMarketingFlows(data.flow_id)
})
