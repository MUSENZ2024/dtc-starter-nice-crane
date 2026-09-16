import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import {
  CarrierEvent,
  TrackInfo,
  carrierFamily,
  classifyEvent,
  classifyTrackingStage,
  encryptTrackingNumber,
  eventTime,
  fallbackHours,
  flattenTrackingEvents,
  nextPollDelayMinutes,
  percentile,
  trackingHash,
} from "../../lib/tracking-intelligence";
import { TRACKING_INTELLIGENCE_MODULE } from "../../modules/tracking-intelligence";
import TrackingIntelligenceModuleService from "../../modules/tracking-intelligence/service";

const WORKER =
  process.env.MUSE_TRACKING_WORKER_URL ||
  "https://muse-track.nz-nofilter.workers.dev";

type Input = { tracking_number: string };

export type LookupTrackingResult =
  | { status: "registered" }
  | { status: "not_found" }
  | {
      status: "ok";
      track_info: TrackInfo;
      prediction: {
        stage: ReturnType<typeof classifyTrackingStage>;
        estimated_at: string;
        earliest_at: string;
        latest_at: string;
        sample_count: number;
        confidence: "low" | "medium" | "high";
        source: "muse-history" | "stage-baseline";
      };
    };

type WorkerResponse = {
  data?: {
    accepted?: Array<{ number?: string; track_info?: TrackInfo }>;
    rejected?: Array<{
      number?: string;
      error?: { code?: number; message?: string };
    }>;
  };
};

async function callWorker(
  endpoint: "gettrackinfo" | "register",
  number: string,
) {
  const response = await fetch(WORKER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint, body: [{ number }] }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(`Tracking provider returned ${response.status}`);
  return (await response.json()) as WorkerResponse;
}

const validTime = (event: CarrierEvent) => {
  const milliseconds = new Date(eventTime(event)).getTime();
  return Number.isFinite(milliseconds) ? milliseconds : null;
};

const deliveryDate = (milliseconds: number) => {
  const date = new Date(milliseconds);
  // NZ Post can deliver on Saturdays, but a Sunday ETA is misleading.
  if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
};

export const lookupTrackingStep = createStep<
  Input,
  LookupTrackingResult,
  undefined
>("lookup-tracking", async ({ tracking_number }: Input, { container }) => {
  const service: TrackingIntelligenceModuleService = container.resolve(
    TRACKING_INTELLIGENCE_MODULE,
  );
  const saveActiveTracking = async (
    status: string,
    stage: ReturnType<typeof classifyTrackingStage>,
    events: CarrierEvent[],
  ) => {
    const hash = trackingHash(tracking_number);
    const existing = await service.listActiveTrackings(
      { tracking_hash: hash },
      { take: 1 },
    );
    const now = new Date();
    const latestEventMs = validTime(events[0]);
    const values = {
      tracking_hash: hash,
      encrypted_number:
        existing[0]?.encrypted_number || encryptTrackingNumber(tracking_number),
      status,
      stage,
      active: stage !== "delivered",
      last_checked_at: now,
      next_check_at: new Date(
        now.getTime() + nextPollDelayMinutes[stage] * 60_000,
      ),
      last_event_at: latestEventMs ? new Date(latestEventMs) : null,
    };

    if (existing[0]) {
      await service.updateActiveTrackings({ id: existing[0].id, ...values });
    } else {
      await service.createActiveTrackings(values);
    }
  };

  const response = await callWorker("gettrackinfo", tracking_number);
  const accepted = response.data?.accepted?.[0];
  const rejected = response.data?.rejected?.[0];
  const track = accepted?.track_info;
  const events = flattenTrackingEvents(track);

  if (!track?.tracking?.providers?.length || !events.length) {
    if (
      rejected?.error?.code === -18019902 ||
      !track?.tracking?.providers?.length
    ) {
      await callWorker("register", tracking_number);
      await saveActiveTracking("registered", "placed", []);
      return new StepResponse<LookupTrackingResult>({
        status: "registered",
      });
    }
    await saveActiveTracking("not_found", "placed", []);
    return new StepResponse<LookupTrackingResult>({ status: "not_found" });
  }

  const stage = classifyTrackingStage(track, events);
  const family = carrierFamily(events);
  const routeKey = "CN-NZ";

  if (stage === "delivered") {
    const deliveredEvent =
      events.find((event) => classifyEvent(event) === "delivered") || events[0];
    const deliveredAtMs = validTime(deliveredEvent);
    if (deliveredAtMs) {
      const hash = trackingHash(tracking_number);
      const closestByStage = new Map<
        string,
        { event: CarrierEvent; at: number }
      >();
      for (const event of events) {
        const at = validTime(event);
        if (!at || at > deliveredAtMs) continue;
        const eventStage = classifyEvent(event);
        if (["delivered", "pickup", "exception"].includes(eventStage)) continue;
        const previous = closestByStage.get(eventStage);
        if (!previous || at > previous.at)
          closestByStage.set(eventStage, { event, at });
      }

      for (const [sampleStage, sample] of closestByStage) {
        const sampleKey = `${hash}:${sampleStage}`;
        const values = {
          sample_key: sampleKey,
          tracking_hash: hash,
          route_key: routeKey,
          carrier_family: family,
          origin_country: "CN",
          destination_country: "NZ",
          stage: sampleStage,
          observed_at: new Date(sample.at),
          delivered_at: new Date(deliveredAtMs),
          remaining_hours: Math.max(0, (deliveredAtMs - sample.at) / 3_600_000),
        };
        const existing = await service.listTrackingSamples(
          { sample_key: sampleKey },
          { take: 1 },
        );
        if (existing[0])
          await service.updateTrackingSamples({
            id: existing[0].id,
            ...values,
          });
        else await service.createTrackingSamples(values);
      }
    }
  }

  let samples = await service.listTrackingSamples(
    { route_key: routeKey, carrier_family: family, stage },
    { take: 250, order: { delivered_at: "DESC" } },
  );
  if (samples.length < 5) {
    samples = await service.listTrackingSamples(
      { destination_country: "NZ", stage },
      { take: 250, order: { delivered_at: "DESC" } },
    );
  }

  const learnedHours = samples
    .map((sample) => Number(sample.remaining_hours))
    .filter(Number.isFinite);
  const expectedHours =
    learnedHours.length >= 5
      ? percentile(learnedHours, 0.5)
      : fallbackHours[stage];
  const lowHours =
    learnedHours.length >= 5
      ? percentile(learnedHours, 0.25)
      : Math.max(0, expectedHours * 0.75);
  const highHours =
    learnedHours.length >= 5
      ? percentile(learnedHours, 0.8)
      : expectedHours * 1.35;
  const now = Date.now();
  await saveActiveTracking(
    track.latest_status?.status || "unknown",
    stage,
    events,
  );

  return new StepResponse<LookupTrackingResult>({
    status: "ok",
    track_info: track,
    prediction: {
      stage,
      estimated_at: deliveryDate(now + expectedHours * 3_600_000),
      earliest_at: deliveryDate(now + lowHours * 3_600_000),
      latest_at: deliveryDate(now + highHours * 3_600_000),
      sample_count: learnedHours.length,
      confidence:
        learnedHours.length >= 25
          ? "high"
          : learnedHours.length >= 8
            ? "medium"
            : "low",
      source: learnedHours.length >= 5 ? "muse-history" : "stage-baseline",
    },
  });
});
