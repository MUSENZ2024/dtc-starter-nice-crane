import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export type TrackingStage =
  | "placed"
  | "processing"
  | "intransit"
  | "arrived"
  | "outfordelivery"
  | "pickup"
  | "exception"
  | "delivered";

export type CarrierEvent = {
  time_iso?: string;
  time_utc?: string;
  description?: string;
  location?: string;
  carrier?: string;
};

export type TrackInfo = {
  latest_status?: { status?: string };
  latest_event?: { description?: string; location?: string; stage?: string };
  tracking?: {
    providers?: Array<{
      provider?: { name?: string; country?: string };
      events?: CarrierEvent[];
    }>;
  };
};

const has = (text: string, phrases: string[]) =>
  phrases.some((phrase) => text.includes(phrase));

const DELIVERED = [
  "delivered",
  "successfully received",
  "successfully signed",
  "已妥投",
];
const PICKUP = [
  "available for pickup",
  "available for pick up",
  "ready for collection",
  "ready to collect",
  "awaiting collection",
  "collect from",
  "pickup point",
];
const FAILED_DELIVERY = [
  "attempted delivery",
  "attempted / failed delivery",
  "delivery attempted",
  "failed delivery",
  "unable to deliver",
  "couldn't deliver",
  "could not deliver",
  "card to call",
  "recipient absent",
];
const OUT_FOR_DELIVERY = [
  "out for delivery",
  "with courier",
  "on vehicle",
  "delivery today",
  "ready for courier",
];
const LOCAL = [
  "local/regional depot",
  "local depot",
  "regional depot",
  "in transit to local depot",
  "item at depot",
  "delivery depot",
];
const ARRIVED = [
  "international arrival",
  "arrived in new zealand",
  "arrived at destination",
  "arrival at destination",
  "destination processing center",
  "destination processing centre",
  "pending border clearance",
  "leaving the new zealand processing center",
  "leaving new zealand processing center",
  "新西兰",
];
const PROCESSING = [
  "packed",
  "packing",
  "processing",
  "accepted",
  "handed to carrier",
  "picked up",
  "received by carrier",
];

export const eventTime = (event?: CarrierEvent) =>
  event?.time_iso || event?.time_utc || "";

export function flattenTrackingEvents(track?: TrackInfo): CarrierEvent[] {
  const events = (track?.tracking?.providers || []).flatMap((provider) =>
    (provider.events || []).map((event) => ({
      ...event,
      carrier: provider.provider?.name || "International Carrier",
    })),
  );

  return events.sort(
    (a, b) =>
      new Date(eventTime(b)).getTime() - new Date(eventTime(a)).getTime(),
  );
}

export function classifyTrackingStage(
  track: TrackInfo | undefined,
  events: CarrierEvent[],
): TrackingStage {
  const status = (track?.latest_status?.status || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
  const latest = events[0];
  const latestText = [latest?.description, latest?.location]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const combined = `${status} ${latestText}`;

  // 17TRACK's normalized status is more reliable than the final provider line.
  if (has(status, DELIVERED) || has(latestText, DELIVERED)) return "delivered";
  if (has(status, PICKUP) || has(latestText, PICKUP)) return "pickup";
  if (has(status, FAILED_DELIVERY) || has(latestText, FAILED_DELIVERY))
    return "exception";
  if (has(combined, OUT_FOR_DELIVERY)) return "outfordelivery";
  if (
    has(combined, [...LOCAL, ...ARRIVED]) ||
    latest?.carrier?.toLowerCase().includes("nz post")
  ) {
    return "arrived";
  }
  if (
    has(combined, [
      "in transit",
      "departed",
      "airline",
      "dispatched",
      "航空公司",
      "离开",
    ])
  ) {
    return "intransit";
  }
  if (has(combined, PROCESSING)) return "processing";
  return events.length ? "intransit" : "placed";
}

export function classifyEvent(event: CarrierEvent): TrackingStage {
  return classifyTrackingStage({ latest_status: { status: "" } }, [
    { ...event, carrier: event.carrier },
  ]);
}

export const trackingHash = (trackingNumber: string) =>
  createHash("sha256")
    .update(
      `${process.env.TRACKING_HASH_SALT || process.env.JWT_SECRET || "muse-tracking"}:${trackingNumber}`,
    )
    .digest("hex");

const encryptionKey = () =>
  createHash("sha256")
    .update(
      process.env.TRACKING_ENCRYPTION_KEY ||
        process.env.JWT_SECRET ||
        "muse-tracking-development-key",
    )
    .digest();

export function encryptTrackingNumber(trackingNumber: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(trackingNumber, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((value) => value.toString("base64url"))
    .join(".");
}

export function decryptTrackingNumber(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted tracking number");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export const nextPollDelayMinutes: Record<TrackingStage, number> = {
  placed: 360,
  processing: 240,
  intransit: 120,
  arrived: 30,
  outfordelivery: 15,
  pickup: 30,
  exception: 30,
  delivered: 0,
};

export const carrierFamily = (events: CarrierEvent[]) => {
  const names = events
    .map((event) => event.carrier?.toLowerCase() || "")
    .join(" ");
  if (names.includes("ems") || names.includes("china post")) return "ems-cn-nz";
  return "international-nz";
};

export const fallbackHours: Record<TrackingStage, number> = {
  placed: 240,
  processing: 192,
  intransit: 96,
  arrived: 36,
  outfordelivery: 8,
  pickup: 0,
  exception: 24,
  delivered: 0,
};

export function percentile(values: number[], fraction: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(fraction * sorted.length) - 1),
  );
  return sorted[index];
}
