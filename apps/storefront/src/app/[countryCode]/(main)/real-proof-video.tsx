"use client"

import { useEffect, useRef, useState } from "react"

type RealProofVideoProps = {
  src: string
  poster: string
}

// The mp4 behind this card is ~2MB. Loading it eagerly (the old `autoPlay`
// behavior) meant every visitor downloaded and decoded it on page load even
// if they never scrolled the carousel into view. Instead we only attach the
// `src` (which starts the fetch) once the card is actually near the
// viewport, and show a small spinner over the poster while it buffers.
export default function RealProofVideo({ src, poster }: RealProofVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldLoad) return
    setIsBuffering(true)
  }, [shouldLoad])

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          onCanPlay={() => setIsBuffering(false)}
          className="h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt="Customer photo"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
      {isBuffering ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10"
          aria-hidden="true"
        >
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </div>
      ) : null}
    </div>
  )
}
