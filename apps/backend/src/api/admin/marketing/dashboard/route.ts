import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../modules/marketing"
import MarketingModuleService from "../../../../modules/marketing/service"
import { ABANDONED_CART_MODULE } from "../../../../modules/abandoned-cart"
import AbandonedCartModuleService from "../../../../modules/abandoned-cart/service"
import { buildMarketingReport, numberValue, reportingRange } from "../../../../lib/marketing-reporting"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const range = reportingRange(typeof req.query.from === "string" ? req.query.from : undefined, typeof req.query.to === "string" ? req.query.to : undefined)
    const marketing: MarketingModuleService = req.scope.resolve(MARKETING_MODULE)
    const abandoned: AbandonedCartModuleService = req.scope.resolve(ABANDONED_CART_MODULE)
    const dateFilter = { $gte: range.start, $lte: range.end }
    const [subscribers, captures, emails, enrollments, issuances, attributions, carts] = await Promise.all([
      marketing.listMarketingSubscribers({}, { take: 100_000 }),
      marketing.listMarketingCaptureEvents({ occurred_at: dateFilter }, { take: 100_000 }),
      marketing.listMarketingEmailEvents({}, { take: 100_000 }),
      marketing.listMarketingEnrollments({ entered_at: dateFilter }, { take: 100_000 }),
      marketing.listMarketingOfferIssuances({ issued_at: dateFilter }, { take: 100_000 }),
      marketing.listMarketingAttributionEvents({ occurred_at: dateFilter }, { take: 100_000, relations: ["subscriber", "email_event", "enrollment"] }),
      abandoned.listAbandonedCartCampaigns({}, { take: 100_000 }),
    ])
    const report = buildMarketingReport({
      subscribers, captures, emails, enrollments, issuances, attributions, range,
      abandoned: {
        active_carts: carts.filter((item) => item.status === "active").length,
        recovered_revenue: carts.reduce((sum, item) => sum + numberValue(item.recovered_revenue), 0),
      },
    })
    res.status(200).json(report)
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invalid reporting range" })
  }
}
