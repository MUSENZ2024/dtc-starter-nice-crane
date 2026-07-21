import type { ExecArgs } from "@medusajs/framework/types"
import { MARKETING_MODULE } from "../modules/marketing"
import MarketingModuleService from "../modules/marketing/service"
import { enrollWelcomeFlowWorkflow } from "../workflows/marketing/enroll-welcome-flow"
import { issueWelcomeOfferWorkflow } from "../workflows/marketing/issue-welcome-offer"

export default async function backfillWelcomeEnrollments({ container }: ExecArgs) {
  const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
  const subscribers = await service.listMarketingSubscribers(
    { status: "subscribed" },
    { take: 100_000, order: { subscribed_at: "ASC" } },
  )

  let enrolled = 0
  let skipped = 0

  for (const subscriber of subscribers) {
    const { result: offer } = await issueWelcomeOfferWorkflow(container).run({
      input: { subscriber_id: subscriber.id },
    })
    const { result: enrollment } = await enrollWelcomeFlowWorkflow(container).run({
      input: { subscriber_id: subscriber.id },
    })

    if (enrollment.status === "enrolled") enrolled += 1
    else skipped += 1

    console.log(
      `Welcome backfill ${subscriber.id}: offer=${offer.status}, enrollment=${enrollment.status}`,
    )
  }

  console.log(
    `Welcome backfill finished: ${enrolled} enrolled, ${skipped} already enrolled or ineligible.`,
  )
}
