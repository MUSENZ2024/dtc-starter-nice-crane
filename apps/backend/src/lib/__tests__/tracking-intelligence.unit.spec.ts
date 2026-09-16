import {
  classifyTrackingStage,
  decryptTrackingNumber,
  encryptTrackingNumber,
  nextPollDelayMinutes,
  percentile,
  type CarrierEvent,
} from "../tracking-intelligence";

describe("tracking intelligence", () => {
  it("prioritises 17TRACK's pickup status over a misleading latest event", () => {
    const events: CarrierEvent[] = [
      {
        description: "Arriving outside of the country.",
        time_iso: "2026-09-16T14:40:00+08:00",
      },
      {
        description:
          "Ready to collect, We couldn't deliver your parcel because a signature was required.",
        time_iso: "2026-09-16T14:20:00+08:00",
      },
    ];

    expect(
      classifyTrackingStage(
        { latest_status: { status: "AvailableForPickup" } },
        events,
      ),
    ).toBe("pickup");
  });

  it("recognises attempted delivery as an actionable exception", () => {
    expect(
      classifyTrackingStage({ latest_status: { status: "DeliveryFailure" } }, [
        { description: "Attempted / Failed Delivery (Notify the Customer)" },
      ]),
    ).toBe("exception");
  });

  it("recognises NZ Post local-depot and camel-case delivery statuses", () => {
    expect(
      classifyTrackingStage({ latest_status: { status: "OutForDelivery" } }, [
        { description: "With courier for delivery" },
      ]),
    ).toBe("outfordelivery");

    expect(
      classifyTrackingStage({ latest_status: { status: "InTransit" } }, [
        { description: "At local/regional depot" },
      ]),
    ).toBe("arrived");
  });

  it("recognises Chinese delivered scans seen in the supplied cohort", () => {
    expect(
      classifyTrackingStage({ latest_status: { status: "Delivered" } }, [
        { description: "【新西兰】已妥投" },
      ]),
    ).toBe("delivered");
  });

  it("uses a robust nearest-rank percentile", () => {
    expect(percentile([96, 24, 72, 48], 0.5)).toBe(48);
    expect(percentile([96, 24, 72, 48], 0.8)).toBe(96);
  });

  it("encrypts stored tracking numbers and can decrypt them for polling", () => {
    const trackingNumber = "EB865003586CN";
    const encrypted = encryptTrackingNumber(trackingNumber);

    expect(encrypted).not.toContain(trackingNumber);
    expect(decryptTrackingNumber(encrypted)).toBe(trackingNumber);
  });

  it("polls urgent stages more frequently than international transit", () => {
    expect(nextPollDelayMinutes.outfordelivery).toBeLessThan(
      nextPollDelayMinutes.intransit,
    );
    expect(nextPollDelayMinutes.arrived).toBeLessThan(
      nextPollDelayMinutes.intransit,
    );
    expect(nextPollDelayMinutes.delivered).toBe(0);
  });
});
