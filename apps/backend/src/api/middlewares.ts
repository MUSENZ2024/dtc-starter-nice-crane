import { defineMiddlewares, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http"
import { PostStoreReviewSchema } from "./store/reviews/route"
import { PostAdminReviewStatusSchema } from "./admin/reviews/[id]/status/route"
import { PostStoreCustomerEmailSchema } from "./store/customers/me/email/route"
import { PostAdminOrderEmailUpdateSchema } from "./admin/orders/[id]/email-updates/route"
import { PostAdminLegacyOrderSchema } from "./admin/legacy-orders/route"
import { PostStoreAbandonedCartClickSchema } from "./store/abandoned-carts/click/route"
import { GetAdminAbandonedCartsSchema } from "./admin/abandoned-carts/route"
import {
  PostStoreMarketingPreferencesSchema,
  PostStoreMarketingEventSchema,
  PostStoreMarketingSubscribeSchema,
  PostStoreMarketingUnsubscribeSchema,
} from "./store/marketing/validators"
import { ManageCampaignSchema, SaveCampaignSchema, ScheduleCampaignSchema, TestCampaignSchema, UpdateMarketingControlSchema } from "./admin/marketing/campaigns/validators"
import { EstimateSegmentSchema, SaveSegmentSchema } from "./admin/marketing/segments/validators"
import {
  PostAdminAttachTrackingSchema,
  PostAdminCreateTrackedShipmentSchema,
} from "./admin/orders/tracking-validators"

export default defineMiddlewares({
  routes: [
    { matcher: "/admin/marketing/campaigns", method: ["POST"], middlewares: [validateAndTransformBody(SaveCampaignSchema)] },
    { matcher: "/admin/marketing/campaigns/:id", method: ["POST"], middlewares: [validateAndTransformBody(SaveCampaignSchema)] },
    { matcher: "/admin/marketing/campaigns/:id/schedule", method: ["POST"], middlewares: [validateAndTransformBody(ScheduleCampaignSchema)] },
    { matcher: "/admin/marketing/campaigns/:id/test-send", method: ["POST"], middlewares: [validateAndTransformBody(TestCampaignSchema)] },
    { matcher: "/admin/marketing/campaigns/:id/manage", method: ["POST"], middlewares: [validateAndTransformBody(ManageCampaignSchema)] },
    { matcher: "/admin/marketing/control", method: ["POST"], middlewares: [validateAndTransformBody(UpdateMarketingControlSchema)] },
    { matcher: "/admin/marketing/segments", method: ["POST"], middlewares: [validateAndTransformBody(SaveSegmentSchema)] },
    { matcher: "/admin/marketing/segments/estimate", method: ["POST"], middlewares: [validateAndTransformBody(EstimateSegmentSchema)] },
    {
      matcher: "/store/marketing/events",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreMarketingEventSchema)],
    },
    {
      matcher: "/store/marketing/subscribe",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreMarketingSubscribeSchema)],
    },
    {
      matcher: "/store/marketing/unsubscribe",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreMarketingUnsubscribeSchema)],
    },
    {
      matcher: "/store/marketing/preferences/:token",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreMarketingPreferencesSchema)],
    },
    {
      matcher: "/admin/abandoned-carts",
      method: ["GET"],
      middlewares: [validateAndTransformQuery(GetAdminAbandonedCartsSchema, {})],
    },
    {
      matcher: "/store/abandoned-carts/click",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreAbandonedCartClickSchema)],
    },
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
      matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/shipments",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminCreateTrackedShipmentSchema)],
    },
    {
      matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/tracking",
      method: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminAttachTrackingSchema)],
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
