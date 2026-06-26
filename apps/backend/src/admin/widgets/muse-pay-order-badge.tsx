import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { CreditCardSolid } from "@medusajs/icons"
import { Container, Text } from "@medusajs/ui"

type OrderWithMetadata = HttpTypes.AdminOrder & {
  metadata?: Record<string, unknown> | null
}

/**
 * order.metadata.muse_split_pay is stamped on the cart before checkout
 * completion (see apps/storefront/src/app/api/split-pay/complete/route.ts)
 * and copied onto the order by completeCartWorkflow — the same flag the
 * order.placed subscriber reads to pick the MUSE Pay confirmation email.
 * Renders nothing for every other order so this stays invisible noise-free.
 */
const MusePayOrderBadge = ({ data: order }: DetailWidgetProps<OrderWithMetadata>) => {
  if (order.metadata?.muse_split_pay !== "true") {
    return null
  }

  const scheduleId = order.metadata?.split_pay_schedule_id as string | undefined

  return (
    <Container className="flex items-center gap-3 bg-ui-tag-orange-bg border-ui-tag-orange-border px-4 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ui-tag-orange-icon">
        <CreditCardSolid className="text-ui-fg-on-color" />
      </div>
      <div>
        <Text size="small" leading="compact" weight="plus" className="text-ui-tag-orange-text">
          MUSE Pay order
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Paid in 4 weekly instalments — ships once the final payment clears.
          {scheduleId ? ` Stripe schedule: ${scheduleId}` : ""}
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default MusePayOrderBadge
