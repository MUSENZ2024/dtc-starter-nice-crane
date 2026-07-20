import { NextRequest, NextResponse } from "next/server"

const PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete"
const REQUEST_TIMEOUT_MS = 4_000

function getApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  )
}

export async function POST(request: NextRequest) {
  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: "Address autocomplete is not configured." },
      { status: 503 },
    )
  }

  const body = (await request.json().catch(() => null)) as {
    input?: unknown
    countryCode?: unknown
    sessionToken?: unknown
  } | null
  const input = typeof body?.input === "string" ? body.input.trim() : ""
  const countryCode =
    typeof body?.countryCode === "string"
      ? body.countryCode.toLowerCase()
      : "nz"
  const sessionToken =
    typeof body?.sessionToken === "string" ? body.sessionToken : ""

  if (input.length < 3 || input.length > 160) {
    return NextResponse.json({ suggestions: [] })
  }

  if (!/^[a-z]{2}$/.test(countryCode) || sessionToken.length > 100) {
    return NextResponse.json(
      { error: "Invalid address request." },
      { status: 400 },
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: [countryCode],
        includedPrimaryTypes: ["street_address", "premise", "subpremise"],
        languageCode: "en",
        regionCode: countryCode,
        sessionToken: sessionToken || undefined,
      }),
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Google could not return address suggestions." },
        { status: response.status },
      )
    }

    const data = (await response.json()) as {
      suggestions?: Array<{
        placePrediction?: {
          placeId?: string
          text?: { text?: string }
          structuredFormat?: {
            mainText?: { text?: string }
            secondaryText?: { text?: string }
          }
        }
      }>
    }

    const suggestions = (data.suggestions ?? []).flatMap((item) => {
      const prediction = item.placePrediction
      if (!prediction?.placeId || !prediction.text?.text) {
        return []
      }

      return [
        {
          place_id: prediction.placeId,
          description: prediction.text.text,
          structured_formatting: {
            main_text: prediction.structuredFormat?.mainText?.text,
            secondary_text: prediction.structuredFormat?.secondaryText?.text,
          },
        },
      ]
    })

    return NextResponse.json(
      { suggestions: suggestions.slice(0, 5) },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "AbortError"
    return NextResponse.json(
      {
        error: timedOut
          ? "Address suggestions timed out."
          : "Address suggestions are temporarily unavailable.",
      },
      { status: timedOut ? 504 : 502 },
    )
  } finally {
    clearTimeout(timeout)
  }
}
