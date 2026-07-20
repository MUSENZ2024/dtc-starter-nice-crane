import { NextRequest, NextResponse } from "next/server"

const PLACES_API_BASE = "https://places.googleapis.com/v1"
const REQUEST_TIMEOUT_MS = 4_000

type AddressComponent = {
  longText?: string
  shortText?: string
  types?: string[]
}

function getApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  )
}

function getPart(
  components: AddressComponent[],
  type: string,
  name: "longText" | "shortText" = "longText",
) {
  return (
    components.find((component) => component.types?.includes(type))?.[name] ||
    ""
  )
}

export async function GET(request: NextRequest) {
  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: "Address lookup is not configured." },
      { status: 503 },
    )
  }

  const placeId = request.nextUrl.searchParams.get("placeId")?.trim() || ""
  const sessionToken =
    request.nextUrl.searchParams.get("sessionToken")?.trim() || ""
  const countryCode =
    request.nextUrl.searchParams.get("countryCode")?.toLowerCase() || "nz"

  if (!placeId || placeId.length > 300 || !/^[a-z]{2}$/.test(countryCode)) {
    return NextResponse.json(
      { error: "Invalid place request." },
      { status: 400 },
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const query = new URLSearchParams({
      languageCode: "en",
      regionCode: countryCode,
    })
    if (sessionToken) {
      query.set("sessionToken", sessionToken)
    }

    const response = await fetch(
      `${PLACES_API_BASE}/places/${encodeURIComponent(placeId)}?${query}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "addressComponents,postalAddress,formattedAddress",
        },
        cache: "no-store",
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Google could not return address details." },
        { status: response.status },
      )
    }

    const place = (await response.json()) as {
      addressComponents?: AddressComponent[]
      postalAddress?: {
        postalCode?: string
        locality?: string
        administrativeArea?: string
        regionCode?: string
        addressLines?: string[]
      }
      formattedAddress?: string
    }
    const components = place.addressComponents ?? []
    const streetNumber = getPart(components, "street_number")
    const route = getPart(components, "route")
    const subpremise = getPart(components, "subpremise")
    const suburb =
      getPart(components, "sublocality_level_1") ||
      getPart(components, "sublocality") ||
      getPart(components, "neighborhood") ||
      getPart(components, "administrative_area_level_3")
    const city =
      getPart(components, "locality") ||
      getPart(components, "postal_town") ||
      place.postalAddress?.locality ||
      getPart(components, "administrative_area_level_2")
    const postalCode =
      getPart(components, "postal_code") ||
      place.postalAddress?.postalCode ||
      ""
    const countryCodeFromGoogle =
      getPart(components, "country", "shortText") ||
      place.postalAddress?.regionCode ||
      countryCode
    const addressLine =
      [streetNumber, route].filter(Boolean).join(" ") ||
      place.postalAddress?.addressLines?.[0] ||
      place.formattedAddress?.split(",")[0] ||
      ""

    return NextResponse.json(
      {
        address: {
          address_1: addressLine,
          address_2: subpremise,
          province: suburb,
          city,
          postal_code: postalCode,
          country_code: countryCodeFromGoogle.toLowerCase(),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "AbortError"
    return NextResponse.json(
      {
        error: timedOut
          ? "Address details timed out."
          : "Address details are temporarily unavailable.",
      },
      { status: timedOut ? 504 : 502 },
    )
  } finally {
    clearTimeout(timeout)
  }
}
