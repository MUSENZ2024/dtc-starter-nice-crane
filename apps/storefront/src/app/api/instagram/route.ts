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
    return NextResponse.json(
      { error: "Instagram access token is not configured." },
      { status: 500 }
    )
  }

  const url = new URL("https://graph.instagram.com/me/media")
  url.searchParams.set("fields", INSTAGRAM_FIELDS)
  url.searchParams.set("limit", "6")
  url.searchParams.set("access_token", token)

  try {
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null)
      const message =
        errorPayload?.error?.message || "Unable to load Instagram posts."

      return NextResponse.json(
        { error: message },
        { status: response.status }
      )
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
  } catch {
    return NextResponse.json(
      { error: "Unable to load Instagram posts." },
      { status: 500 }
    )
  }
}
