import { model } from "@medusajs/framework/utils"

const Review = model
  .define("review", {
    id: model.id().primaryKey(),
    title: model.text().nullable(),
    content: model.text(),
    rating: model.float(),
    reviewer_name: model.text(),
    reviewer_email: model.text().nullable(),
    product_id: model.text().index("IDX_REVIEW_PRODUCT_ID").nullable(),
    image_url: model.text().nullable(),
    source: model.enum(["legacy", "customer"]).default("customer"),
    status: model.enum(["pending", "approved", "rejected"]).default("pending"),
    verified_purchase: model.boolean().default(false),
  })
  .checks([
    {
      name: "review_rating_range",
      expression: (columns) => `${columns.rating} >= 1 AND ${columns.rating} <= 5`,
    },
  ])

export default Review
