"use client"

import { useEffect, useState } from "react"

type InstagramPost = {
  id: string
  caption: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_url: string
  thumbnail_url: string
  permalink: string
  timestamp: string
}

type FeedState =
  | { status: "loading"; posts: InstagramPost[]; error?: never }
  | { status: "ready"; posts: InstagramPost[]; error?: never }
  | { status: "error"; posts: InstagramPost[]; error: string }

const getPostImage = (post: InstagramPost) =>
  post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url

const fallbackPosts = Array.from({ length: 6 })

export default function InstagramFeed() {
  const [feed, setFeed] = useState<FeedState>({
    status: "loading",
    posts: [],
  })

  useEffect(() => {
    let active = true

    fetch("/api/instagram")
      .then(async (response) => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || "Instagram feed unavailable.")
        }

        return data.posts as InstagramPost[]
      })
      .then((posts) => {
        if (!active) {
          return
        }

        setFeed({ status: "ready", posts: posts.slice(0, 6) })
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setFeed({
          status: "error",
          posts: [],
          error:
            error instanceof Error
              ? error.message
              : "Instagram feed unavailable.",
        })
      })

    return () => {
      active = false
    }
  }, [])

  if (feed.status === "loading") {
    return (
      <div className="mb-8 grid grid-cols-3 gap-2 small:grid-cols-6">
        {fallbackPosts.map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-[14px] bg-[linear-gradient(135deg,#E8E6E0,#F8F7F4)]"
          />
        ))}
      </div>
    )
  }

  if (feed.status === "error") {
    return (
      <div className="mb-8 rounded-[18px] bg-[#FDF4EF] px-5 py-6 text-center">
        <p className="text-[13px] font-bold text-[#0A0A0A]">
          Instagram posts could not load right now.
        </p>
        <p className="mt-1 text-[12px] text-[#666]">{feed.error}</p>
      </div>
    )
  }

  if (!feed.posts.length) {
    return (
      <div className="mb-8 rounded-[18px] bg-[#F8F7F4] px-5 py-6 text-center">
        <p className="text-[13px] font-bold text-[#0A0A0A]">
          No Instagram posts found yet.
        </p>
        <p className="mt-1 text-[12px] text-[#666]">
          Follow @muse.nz for the latest drops and updates.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-8 grid grid-cols-3 gap-2 small:grid-cols-6">
      {feed.posts.map((post) => {
        const image = getPostImage(post)

        return (
          <a
            key={post.id}
            href={post.permalink}
            className="group relative aspect-square overflow-hidden rounded-[14px] bg-[linear-gradient(135deg,#E8E6E0,#F8F7F4)] transition hover:scale-[1.03]"
            target="_blank"
            rel="noreferrer"
            aria-label={post.caption || "Open MUSE Instagram post"}
          >
            {image ? (
              <img
                src={image}
                alt={post.caption || "MUSE Instagram post"}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.1em] text-black/30">
                @muse.nz
              </div>
            )}
            {post.media_type === "VIDEO" && (
              <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                Reel
              </span>
            )}
          </a>
        )
      })}
    </div>
  )
}
