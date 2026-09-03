"use client"

import { HttpTypes } from "@medusajs/types"
import { FulfilmentState } from "@lib/util/fulfilment-state"
import Image from "next/image"
import DeliveryBadge from "@modules/products/components/delivery-badge"
import { useEffect, useMemo, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  fulfilment: FulfilmentState
  productTitle: string
  outOfStock: boolean
  colourImageMap?: Record<string, string>
}

const ImageGallery = ({
  images,
  fulfilment,
  productTitle,
  outOfStock,
  colourImageMap,
}: ImageGalleryProps) => {
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
  useEffect(() => {
    const handleColourChange = (event: Event) => {
      const colour = (event as CustomEvent<{ colour?: string }>).detail?.colour
      const url = colour ? colourImageMap?.[colour] : undefined
      const index = url
        ? galleryImages.findIndex((image) => image.url === url)
        : -1
      if (index >= 0) setActiveIndex(index)
    }
    window.addEventListener("muse:product-colour-change", handleColourChange)
    return () =>
      window.removeEventListener(
        "muse:product-colour-change",
        handleColourChange
      )
  }, [colourImageMap, galleryImages])
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
    <div className="muse-product-gallery">
      <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-none bg-[#F4F5F7]">
        {activeImage?.url ? (
          <Image
            src={activeImage.url}
            priority
            fetchPriority="high"
            className="absolute inset-0"
            alt={`${productTitle}, photo ${activeIndex + 1} of ${
              galleryImages.length
            }`}
            fill
            sizes="(max-width: 900px) 100vw, 720px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span className="text-[80px] font-black tracking-[-0.05em] text-black/10 small:text-[160px]">
            01
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-10 top-4 z-[2] rounded-none bg-[#0A0A0A] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-[#F4F2ED]">
            Out of stock
          </span>
        )}
        <DeliveryBadge label={fulfilment.shortLabel} />
        <span className="absolute bottom-4 right-4 rounded-none bg-[#0A0A0A]/70 px-3 py-1.5 text-[11px] font-semibold tracking-[0.05em] text-[#F4F2ED] backdrop-blur">
          {activeIndex + 1} / {galleryImages.length}
        </span>
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-none bg-white/90 text-[24px] leading-none text-[#0A0A0A] backdrop-blur transition hover:bg-white"
              aria-label={`Previous photo of ${productTitle}`}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-none bg-white/90 text-[24px] leading-none text-[#0A0A0A] backdrop-blur transition hover:bg-white"
              aria-label={`Next photo of ${productTitle}`}
            >
              ›
            </button>
          </>
        )}
      </div>
      {hasMultipleImages && (
        <div className="muse-gallery-pagination" aria-label="Product photo navigation">
          {galleryImages.map((image, index) => (
            <button key={image.id} type="button"
              aria-label={`View photo ${index + 1} of ${productTitle}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}>
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2.5">
        {thumbSlots.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`View photo ${index + 1} of ${productTitle}`}
            aria-current={index === activeIndex ? "true" : undefined}
            className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-none border-2 bg-[#F4F5F7] text-xl font-black text-black/10 transition hover:-translate-y-0.5 ${
              index === activeIndex ? "border-[#0A0A0A]" : "border-transparent"
            }`}
          >
            {image.url ? (
              <Image
                src={image.url}
                alt=""
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
