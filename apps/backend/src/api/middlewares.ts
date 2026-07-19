import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostStoreReviewSchema } from "./store/reviews/route"
import { PostAdminReviewStatusSchema } from "./admin/reviews/[id]/status/route"
import { PostStoreCustomerEmailSchema } from "./store/customers/me/email/route"
import { PostAdminOrderEmailUpdateSchema } from "./admin/orders/[id]/email-updates/route"
import { PostAdminLegacyOrderSchema } from "./admin/legacy-orders/route"

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
      matcher: "/admin/orders/:id/email-updates",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminOrderEmailUpdateSchema)],
    },
    {
      matcher: "/admin/legacy-orders",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminLegacyOrderSchema)],
    },
    {
      matcher: "/store/customers/me/email",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreCustomerEmailSchema)],
    },
  ],
})
