import { NextResponse } from "next/server"

export const revalidate = 3600
export const dynamic = "force-dynamic"

type InstagramMedia = {
  id: string
  caption?: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
}

type InstagramErrorPayload = {
  error?: {
    code?: number
    type?: string
  }
}

const UNAVAILABLE_RESPONSE = {
  error: "Instagram feed is temporarily unavailable.",
}

const unavailable = () =>
  NextResponse.json(UNAVAILABLE_RESPONSE, {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
    },
  })

const INSTAGRAM_FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
].join(",")

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!token) {
    console.error("[instagram] Access token is not configured")
    return unavailable()
  }

  const url = new URL("https://graph.instagram.com/me/media")
  url.searchParams.set("fields", INSTAGRAM_FIELDS)
  url.searchParams.set("limit", "6")
  url.searchParams.set("access_token", token)

  try {
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      const errorPayload = (await response
        .json()
        .catch(() => null)) as InstagramErrorPayload | null

      console.error("[instagram] Media request failed", {
        status: response.status,
        code: errorPayload?.error?.code,
        type: errorPayload?.error?.type,
      })

      return unavailable()
    }

    const payload = (await response.json()) as { data?: InstagramMedia[] }

    return NextResponse.json(
      {
        posts: (payload.data || []).slice(0, 6).map((post) => ({
          id: post.id,
          caption: post.caption || "",
          media_type: post.media_type,
          media_url: post.media_url || "",
          thumbnail_url: post.thumbnail_url || "",
          permalink: post.permalink,
          timestamp: post.timestamp,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("[instagram] Media request could not be completed", {
      type: error instanceof Error ? error.name : "UnknownError",
    })
    return unavailable()
  }
}
