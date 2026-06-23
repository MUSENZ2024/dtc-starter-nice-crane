import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_REVIEW_MODULE } from "../../../modules/product-review"
import ProductReviewModuleService from "../../../modules/product-review/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: ProductReviewModuleService = req.scope.resolve(PRODUCT_REVIEW_MODULE)
  const reviews = await service.listReviews({}, { order: { created_at: "DESC" } })
  res.json({ reviews, count: reviews.length })
}
