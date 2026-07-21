import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { markAbandonedCartRecoveredWorkflow } from "../workflows/mark-abandoned-cart-recovered";

export default async function abandonedCartRecoveredHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  try {
    await markAbandonedCartRecoveredWorkflow(container).run({
      input: { order_id: data.id },
    });
  } catch (error) {
    logger.error(
      `Abandoned-cart recovery attribution failed for ${data.id}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
