import { MedusaContainer } from "@medusajs/framework/types"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { PRODUCT_REVIEW_MODULE } from "../modules/product-review"
import ProductReviewModuleService from "../modules/product-review/service"

type LegacyReview = {
  id?: string
  image?: string
  name: string
  text: string
  rating?: number
}

const arrayLiteralAfter = (source: string, marker: string) => {
  const markerIndex = source.indexOf(marker)
  const equalsIndex = source.indexOf("=", markerIndex)
  const start = source.indexOf("[", equalsIndex)
  let depth = 0
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "[") depth += 1
    if (source[index] === "]") depth -= 1
    if (depth === 0) return source.slice(start, index + 1)
  }
  throw new Error(`Could not find ${marker}`)
}

const parseRecords = (literal: string): LegacyReview[] =>
  // The legacy arrays contain plain object literals only; this keeps the import
  // tied to the one existing source of truth instead of maintaining a second copy.
  Function(`return (${literal})`)() as LegacyReview[]

const reviewKey = (review: Pick<LegacyReview, "image" | "name" | "text">) =>
  [review.name.trim(), review.text.trim(), review.image ?? ""].join("::")

export default async function importLegacyReviews({
  container,
}: {
  container: MedusaContainer
}) {
  const root = process.cwd()
  const template = await readFile(
    join(root, "../storefront/src/modules/products/templates/index.tsx"),
    "utf8"
  )
  const written = await readFile(
    join(root, "../storefront/src/modules/products/data/reviews.ts"),
    "utf8"
  )
  const photos = parseRecords(arrayLiteralAfter(template, "const photoReviews"))
  const text = parseRecords(arrayLiteralAfter(written, "allWrittenMuseReviews"))
  const service: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
  const existing = await service.listReviews({ source: "legacy" })
  const existingKeys = new Set(
    existing.map((review) =>
      reviewKey({
        name: review.reviewer_name,
        text: review.content,
        image: review.image_url ?? undefined,
      })
    )
  )
  const legacyReviews = [...photos, ...text]
  const missingReviews = legacyReviews.filter((review) => !existingKeys.has(reviewKey(review)))

  if (!missingReviews.length) {
    container
      .resolve("logger")
      .info(`Legacy reviews already imported; ${existing.length} legacy reviews found.`)
    return
  }

  await service.createReviews(
    missingReviews.map((review) => ({
      title: null,
      content: review.text,
      rating: review.rating ?? 5,
      reviewer_name: review.name,
      image_url: review.image,
      source: "legacy" as const,
      status: "approved" as const,
      verified_purchase: true,
    }))
  )
  container
    .resolve("logger")
    .info(
      `Imported ${missingReviews.length} missing legacy MUSE reviews. ${existing.length} legacy reviews were already present.`
    )
}
