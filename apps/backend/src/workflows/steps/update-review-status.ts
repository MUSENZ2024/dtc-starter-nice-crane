import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review"
import ProductReviewModuleService from "../../modules/product-review/service"

type Input = { id: string; status: "approved" | "rejected" }

export const updateReviewStatusStep = createStep(
  "update-review-status",
  async (input: Input, { container }) => {
    const service: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    const original = await service.retrieveReview(input.id)
    const review = await service.updateReviews(input)
    return new StepResponse(review, original)
  },
  async (original, { container }) => {
    if (!original) return
    const service: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    await service.updateReviews(original)
  }
)
