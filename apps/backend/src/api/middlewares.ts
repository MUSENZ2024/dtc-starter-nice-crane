import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostStoreReviewSchema } from "./store/reviews/route"
import { PostAdminReviewStatusSchema } from "./admin/reviews/[id]/status/route"
import { OrderEmailSchema } from "./admin/orders/[id]/email/validators"
import { UpdateEmailTemplateSchema } from "./admin/email-templates/validators"

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
      matcher: "/admin/orders/:id/email/preview",
      method: ["POST"],
      middlewares: [validateAndTransformBody(OrderEmailSchema)],
    },
    {
      matcher: "/admin/orders/:id/email/send",
      method: ["POST"],
      middlewares: [validateAndTransformBody(OrderEmailSchema)],
    },
    {
      matcher: "/admin/email-templates/:key",
      method: ["POST"],
      middlewares: [validateAndTransformBody(UpdateEmailTemplateSchema)],
    },
  ],
})
