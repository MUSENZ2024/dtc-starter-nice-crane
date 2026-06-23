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
      cache: "no-store",
    })
  } catch {
    return null
  }
}
