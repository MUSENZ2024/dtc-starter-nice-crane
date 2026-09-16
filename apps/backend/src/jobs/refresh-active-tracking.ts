import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { decryptTrackingNumber } from "../lib/tracking-intelligence";
import { TRACKING_INTELLIGENCE_MODULE } from "../modules/tracking-intelligence";
import type TrackingIntelligenceModuleService from "../modules/tracking-intelligence/service";
import { lookupTrackingWorkflow } from "../workflows/lookup-tracking";

const BATCH_SIZE = 60;
const CONCURRENCY = 4;

export default async function refreshActiveTrackingJob(
  container: MedusaContainer,
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const service: TrackingIntelligenceModuleService = container.resolve(
    TRACKING_INTELLIGENCE_MODULE,
  );
  const startedAt = Date.now();

  try {
    const due = await service.listActiveTrackings(
      {
        active: true,
        next_check_at: { $lte: new Date() },
      },
      {
        take: BATCH_SIZE,
        order: { next_check_at: "ASC" },
      },
    );

    let refreshed = 0;
    let failed = 0;

    for (let index = 0; index < due.length; index += CONCURRENCY) {
      const chunk = due.slice(index, index + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map((record) =>
          lookupTrackingWorkflow(container).run({
            input: {
              tracking_number: decryptTrackingNumber(record.encrypted_number),
            },
          }),
        ),
      );
      refreshed += results.filter(
        (result) => result.status === "fulfilled",
      ).length;
      failed += results.filter((result) => result.status === "rejected").length;
    }

    logger.info(
      `[TRACKING] Background refresh completed: ${refreshed} refreshed, ${failed} failed, ${Date.now() - startedAt}ms`,
    );
  } catch (error) {
    logger.error(
      `[TRACKING] Background refresh failed after ${Date.now() - startedAt}ms: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const config = {
  name: "refresh-active-tracking",
  schedule: "*/15 * * * *",
};
