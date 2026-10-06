export type NzPostOpeningHours = {
  day: number;
  open: string;
  close: string;
};

export type NzPostCollectionPoint = {
  name: string;
  address: string;
  phone?: string;
  location_url: string;
  hours: NzPostOpeningHours[];
};

type NzPostTrackingEvent = {
  status?: string;
  pbu?: string;
};

type NzPostTrackingResponse = {
  success?: boolean;
  results?: Array<{
    tracking_reference?: string;
    tracking_events?: NzPostTrackingEvent[];
  }>;
};

type NzPostLocation = {
  id?: number;
  name?: string;
  address?: string;
  phone?: string;
  type?: string;
  partner?: string;
  hours?: NzPostOpeningHours[];
};

const NZPOST_TRACKING_API =
  "https://tools.nzpost.co.nz/tracking/api/parceltrack/parcels";
const NZPOST_LOCATOR_API =
  "https://tools.nzpost.co.nz/tracking/api/locator/locations";

const publicHeaders = {
  accept: "application/json",
  pragma: "no-cache",
  "cache-control": "no-cache",
};

export function findCollectionClientId(response: NzPostTrackingResponse) {
  const events = response.results?.[0]?.tracking_events || [];
  const readyEvent = [...events]
    .reverse()
    .find(
      (event) =>
        event.pbu &&
        /ready to collect|collection point|held for collection/i.test(
          event.status || "",
        ),
    );

  return readyEvent?.pbu || null;
}

export function selectCollectionPoint(locations: NzPostLocation[]) {
  return (
    locations.find(
      (location) =>
        location.partner?.toLowerCase() === "postcentre" ||
        location.type?.toLowerCase() === "postshop",
    ) || locations[0]
  );
}

export async function fetchNzPostCollectionPoint(
  trackingNumber: string,
): Promise<NzPostCollectionPoint | null> {
  try {
    const trackingUrl = new URL(NZPOST_TRACKING_API);
    trackingUrl.searchParams.set("tracking_reference", trackingNumber);
    const trackingResponse = await fetch(trackingUrl, {
      headers: publicHeaders,
      signal: AbortSignal.timeout(6_000),
    });
    if (!trackingResponse.ok) return null;

    const tracking = (await trackingResponse.json()) as NzPostTrackingResponse;
    const clientId = findCollectionClientId(tracking);
    if (!clientId) return null;

    const locatorUrl = new URL(NZPOST_LOCATOR_API);
    locatorUrl.searchParams.set("format", "json");
    for (const type of [
      "Third Party Partner",
      "Depot",
      "Postbox Lobby",
      "PostShop",
    ]) {
      locatorUrl.searchParams.append("type", type);
    }
    locatorUrl.searchParams.set("client_id", clientId);

    const locatorResponse = await fetch(locatorUrl, {
      headers: publicHeaders,
      signal: AbortSignal.timeout(6_000),
    });
    if (!locatorResponse.ok) return null;

    const locations = (await locatorResponse.json()) as NzPostLocation[];
    const location = selectCollectionPoint(locations);
    if (!location?.id || !location.name || !location.address) return null;

    return {
      name: location.name,
      address: location.address,
      phone: location.phone || undefined,
      hours: location.hours || [],
      location_url: `https://www.nzpost.co.nz/tools/postshop-kiwibank-locator/location/${location.id}`,
    };
  } catch {
    // 17TRACK remains the source of truth for status if NZ Post is unavailable.
    return null;
  }
}
