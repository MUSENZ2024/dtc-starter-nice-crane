"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

type Props = {
  images: string[]
  titles?: string[]
}

export default function NuptseSlideshow({ images, titles = [] }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (images.length < 2 || paused) {
      return
    }

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [images.length, paused])

  if (!images.length) {
    return null
  }

  return (
    <div className="relative hidden h-full w-full flex-col items-center justify-center small:flex">
      <div className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-[28px]">
        <Image
          key={`${images[current]}-${current}`}
          src={images[current]}
          alt={titles[current] ?? `Nuptse colour ${current + 1}`}
          fill
          quality={60}
          sizes="420px"
          className="object-cover transition-opacity duration-700"
        />

        {titles[current] && (
          <div className="absolute bottom-4 left-4 right-4 rounded-[14px] bg-black/50 px-4 py-2.5 backdrop-blur-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#C8D050]">
              {titles[current]}
            </p>
          </div>
        )}

      </div>
      {images.length > 1 && (
        <div className="muse-slideshow-controls" aria-label="Nuptse colour navigation">
          <button type="button" aria-label="Previous colour" onClick={() => { setPaused(true); setCurrent((current + images.length - 1) % images.length) }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>
          </button>
          <span className="muse-slideshow-count" aria-live={paused ? "polite" : "off"}>{String(current + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
          <button type="button" aria-label="Next colour" onClick={() => { setPaused(true); setCurrent((current + 1) % images.length) }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>
          </button>
          <button type="button" aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)}>{paused ? "Play" : "Pause"}</button>
        </div>
      )}
    </div>
  )
}
