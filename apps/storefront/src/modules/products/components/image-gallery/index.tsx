"use client"

import { HttpTypes } from "@medusajs/types"
import { FulfilmentState } from "@lib/util/fulfilment-state"
import Image from "next/image"
import { useMemo, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  fulfilment: FulfilmentState
}

const ImageGallery = ({ images, fulfilment }: ImageGalleryProps) => {
  const galleryImages = useMemo(
    () =>
      images.length > 0
        ? images
        : [
            {
              id: "placeholder-1",
              url: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1200&q=85",
            },
            {
              id: "placeholder-2",
              url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85",
            },
          ],
    [images]
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0]
  const thumbSlots = galleryImages.slice(0, 5)
  const hasMultipleImages = galleryImages.length > 1
  const showPrevious = () =>
    setActiveIndex((index) =>
      index === 0 ? galleryImages.length - 1 : index - 1
    )
  const showNext = () =>
    setActiveIndex((index) =>
      index === galleryImages.length - 1 ? 0 : index + 1
    )

  return (
    <div>
      <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-[26px] bg-gradient-to-br from-[#ECE9E2] via-[#F8F7F4] to-[#ECE9E2]">
        {activeImage?.url ? (
          <Image
            src={activeImage.url}
            priority
            className="absolute inset-0"
            alt={`Product image ${activeIndex + 1}`}
            fill
            sizes="(max-width: 900px) 100vw, 720px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span className="text-[80px] font-black tracking-[-0.05em] text-black/10 small:text-[160px]">
            01
          </span>
        )}
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#F4F2ED]/95 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-[#0A0A0A] backdrop-blur">
          <span className={`h-[7px] w-[7px] rounded-full ${fulfilment.dotClassName}`} />
          {fulfilment.label}
        </span>
        <span className="absolute bottom-4 right-4 rounded-full bg-[#0A0A0A]/70 px-3 py-1.5 text-[11px] font-semibold tracking-[0.05em] text-[#F4F2ED] backdrop-blur">
          {activeIndex + 1} / {galleryImages.length}
        </span>
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#F4F2ED]/90 text-[24px] leading-none text-[#0A0A0A] shadow-sm backdrop-blur transition hover:bg-white"
              aria-label="Previous product photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#F4F2ED]/90 text-[24px] leading-none text-[#0A0A0A] shadow-sm backdrop-blur transition hover:bg-white"
              aria-label="Next product photo"
            >
              ›
            </button>
          </>
        )}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              aria-label={`View image ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-[7px] rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-[#0A0A0A]" : "w-[7px] bg-black/15"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {thumbSlots.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setActiveIndex(index)}
            className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[14px] border-2 bg-gradient-to-br from-[#ECE9E2] to-[#F8F7F4] text-xl font-black text-black/10 transition hover:-translate-y-0.5 ${
              index === activeIndex ? "border-[#0A0A0A]" : "border-transparent"
            }`}
          >
            {image.url ? (
              <Image
                src={image.url}
                alt={`Product thumbnail ${index + 1}`}
                fill
                sizes="120px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              String(index + 1).padStart(2, "0")
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ImageGallery
