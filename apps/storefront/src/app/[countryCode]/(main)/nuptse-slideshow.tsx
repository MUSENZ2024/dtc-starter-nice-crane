"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

type Props = {
  images: string[]
  titles?: string[]
}

export default function NuptseSlideshow({ images, titles = [] }: Props) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (images.length < 2) {
      return
    }

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [images.length])

  if (!images.length) {
    return null
  }

  return (
    <div className="relative hidden h-full w-full items-center justify-center small:flex">
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

        <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Go to colour ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === current
                  ? "w-5 bg-[#C8D050]"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
