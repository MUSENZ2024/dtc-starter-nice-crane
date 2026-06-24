import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostStoreReviewSchema } from "./store/reviews/route"
import { PostAdminReviewStatusSchema } from "./admin/reviews/[id]/status/route"
import { PostStoreSplitPayAttachMetadataSchema } from "./store/split-pay/attach-metadata/route"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/reviews",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreReviewSchema)],
    },
    {
      matcher: "/admin/reviews/:id/status",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminReviewStatusSchema)],
    },
    {
      matcher: "/store/split-pay/attach-metadata",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreSplitPayAttachMetadataSchema)],
    },
  ],
})
