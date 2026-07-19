"use server"

import { sdk } from "@lib/config"

export type StoreReview = {
  id: string
  title?: string | null
  content: string
  rating: number
  reviewer_name: string
  image_url?: string | null
  source: "legacy" | "customer"
  verified_purchase: boolean
  created_at: string
}

export type StoreReviewSummary = {
  reviews: StoreReview[]
  total: number
  average: number
  distribution: { rating: number; count: number }[]
}

export async function getStoreReviews(): Promise<StoreReviewSummary | null> {
  try {
    return await sdk.client.fetch<StoreReviewSummary>("/store/reviews/list", {
      method: "GET",
      cache: "force-cache",
      next: {
        revalidate: 300,
      },
    })
  } catch {
    return null
  }
}

export async function getStoreReviewsWithin(
  timeoutMs = 350
): Promise<StoreReviewSummary | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      getStoreReviews(),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), timeoutMs)
      }),
    ])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}
