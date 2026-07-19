"use client"

import Image from "next/image"
import { useState } from "react"

type PhotoReview = {
  id: string
  image: string
  name: string
  date: string
  text: string
}

type PhotoReviewsProps = {
  reviews: PhotoReview[]
}

const INITIAL_REVIEW_COUNT = 12
const REVIEWS_PER_PAGE = 12

const PhotoReviews = ({ reviews }: PhotoReviewsProps) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_REVIEW_COUNT)
  const visibleReviews = reviews.slice(0, visibleCount)
  const remainingCount = reviews.length - visibleReviews.length

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-black uppercase tracking-[0.02em] text-[#0A0A0A] small:text-[34px]">
            Photo reviews
          </h2>
          <p className="mt-1 text-[13px] text-[#666]" aria-live="polite">
            Showing {visibleReviews.length} of {reviews.length} customer photos
          </p>
        </div>
        <span className="hidden text-[11px] font-bold uppercase tracking-[0.1em] text-[#999] small:block">
          Swipe to browse
        </span>
      </div>

      <div className="no-scrollbar -mx-[18px] flex snap-x gap-2 overflow-x-auto px-[18px] pb-3 small:mx-0 small:gap-4 small:px-0">
        {visibleReviews.map((review) => (
          <article
            key={review.id}
            className="w-[126px] shrink-0 snap-start overflow-hidden rounded-[12px] bg-[#F8F7F4] ring-1 ring-[#E8E6E0] small:w-[calc((100%_-_3rem)/4)] small:max-w-[304px] small:rounded-[14px]"
          >
            <div className="relative aspect-[4/3] bg-[#ECE9E2]">
              <Image
                src={review.image}
                alt={`Photo review from ${review.name}`}
                fill
                sizes="(min-width: 768px) 24vw, 126px"
                quality={45}
                className="object-cover"
              />
            </div>
            <div className="p-2.5 small:p-3.5">
              <div className="mb-1.5 flex items-center justify-between gap-2 small:mb-2 small:gap-3">
                <div className="text-[11px] font-black text-[#0A0A0A] small:text-[12.5px]">
                  {review.name}
                </div>
                <div className="text-[8px] font-bold uppercase tracking-[0.04em] text-[#1F7A3A] small:text-[10px] small:tracking-[0.06em]">
                  Verified
                </div>
              </div>
              <div className="mb-2 text-[10px] text-[#888] small:mb-3 small:text-[12px]">
                {review.date}
              </div>
              <p className="line-clamp-4 text-[10.5px] font-medium leading-4 text-[#333] small:text-[12.5px] small:leading-5">
                {review.text}
              </p>
            </div>
          </article>
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((count) =>
                Math.min(count + REVIEWS_PER_PAGE, reviews.length)
              )
            }
            className="min-h-11 rounded-[8px] border border-[#0A0A0A] px-6 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]"
          >
            View more ({remainingCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}

export default PhotoReviews
