import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review"
import ProductReviewModuleService from "../../../../modules/product-review/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: ProductReviewModuleService = req.scope.resolve(PRODUCT_REVIEW_MODULE)
  const reviews = await service.listReviews(
    { status: "approved" },
    { order: { created_at: "DESC" } }
  )
  const total = reviews.length
  const average = total ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }))
  res.json({ reviews, total, average, distribution })
}
