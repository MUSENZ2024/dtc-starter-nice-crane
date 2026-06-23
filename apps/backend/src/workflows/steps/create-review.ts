import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review"
import ProductReviewModuleService from "../../modules/product-review/service"

export type CreateReviewInput = {
  title?: string
  content: string
  rating: number
  reviewer_name: string
  reviewer_email?: string
  product_id?: string
  image_url?: string
  source?: "legacy" | "customer"
  status?: "pending" | "approved" | "rejected"
  verified_purchase?: boolean
}

export const createReviewStep = createStep(
  "create-review",
  async (input: CreateReviewInput, { container }) => {
    const service: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    const review = await service.createReviews(input)
    return new StepResponse(review, review.id)
  },
  async (reviewId, { container }) => {
    if (!reviewId) return
    const service: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    await service.deleteReviews(reviewId)
  }
)
