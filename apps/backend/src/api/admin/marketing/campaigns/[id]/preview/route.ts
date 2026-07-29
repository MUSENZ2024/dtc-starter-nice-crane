import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../../../modules/marketing"
import MarketingModuleService from "../../../../../../modules/marketing/service"
import { renderCampaignEmail, type CampaignBlock } from "../../../../../../lib/marketing-campaign-email"
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) { const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE); const campaign = await service.retrieveMarketingCampaign(req.params.id); const html = renderCampaignEmail({ subject: campaign.subject, previewText: campaign.preview_text, blocks: (campaign.content.blocks || []) as CampaignBlock[], unsubscribeUrl: `${process.env.STOREFRONT_URL || "https://musenz.com"}/marketing/unsubscribe?preview=1`, utmCampaign: campaign.utm_campaign }); res.type("text/html").send(html) }
