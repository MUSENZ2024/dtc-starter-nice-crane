import type { MedusaContainer } from "@medusajs/framework/types"
import { dispatchMarketingCampaignsWorkflow } from "../workflows/marketing/dispatch-marketing-campaigns"
export default async function dispatchMarketingCampaigns(container: MedusaContainer) { await dispatchMarketingCampaignsWorkflow(container).run() }
export const config = { name: "dispatch-marketing-campaigns", schedule: "*/5 * * * *" }
