import { Migration } from "@medusajs/framework/mikro-orm/migrations"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

type LegacyReview = {
  image?: string
  name: string
  text: string
  date?: string
  rating?: number
}

const arrayLiteralAfter = (source: string, marker: string) => {
  const markerIndex = source.indexOf(marker)
  const equalsIndex = source.indexOf("=", markerIndex)
  const start = source.indexOf("[", equalsIndex)
  let depth = 0

  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "[") {
      depth += 1
    }

    if (source[index] === "]") {
      depth -= 1
    }

    if (depth === 0) {
      return source.slice(start, index + 1)
    }
  }

  throw new Error(`Could not find ${marker}`)
}

const parseRecords = (literal: string): LegacyReview[] =>
  Function(`return (${literal})`)() as LegacyReview[]

const findStorefrontRoot = () => {
  const candidates = [
    join(process.cwd(), "../storefront"),
    join(process.cwd(), "../../storefront"),
    join(__dirname, "../../../../../../storefront"),
    join(__dirname, "../../../../../../../storefront"),
  ]

  const storefrontRoot = candidates.find((candidate) =>
    existsSync(join(candidate, "src/modules/products/data/reviews.ts"))
  )

  if (!storefrontRoot) {
    throw new Error("Could not find storefront review source files")
  }

  return storefrontRoot
}

const sqlValue = (value?: string | null) => {
  if (value === undefined || value === null) {
    return "null"
  }

  return `'${value.replace(/'/g, "''")}'`
}

const sqlDate = (value?: string) => {
  if (!value) {
    return "now()"
  }

  const date = new Date(`${value} 12:00:00 GMT+1200`)

  if (Number.isNaN(date.getTime())) {
    return "now()"
  }

  return `${sqlValue(date.toISOString())}::timestamptz`
}

export class Migration20260702001000 extends Migration {
  override async up(): Promise<void> {
    const storefrontRoot = findStorefrontRoot()
    const template = readFileSync(
      join(storefrontRoot, "src/modules/products/templates/index.tsx"),
      "utf8"
    )
    const written = readFileSync(
      join(storefrontRoot, "src/modules/products/data/reviews.ts"),
      "utf8"
    )
    const reviews = [
      ...parseRecords(arrayLiteralAfter(template, "const photoReviews")),
      ...parseRecords(arrayLiteralAfter(written, "allWrittenMuseReviews")),
    ]
    const values = reviews
      .map(
        (review, index) =>
          `('rev_legacy_${String(index + 1).padStart(3, "0")}', null, ${sqlValue(
            review.text
          )}, ${review.rating ?? 5}, ${sqlValue(review.name)}, null, null, ${sqlValue(
            review.image
          )}, 'legacy', 'approved', true, ${sqlDate(review.date)})`
      )
      .join(",")

    this.addSql(
      `insert into "review" ("id", "title", "content", "rating", "reviewer_name", "reviewer_email", "product_id", "image_url", "source", "status", "verified_purchase", "created_at")
select incoming.*
from (values ${values}) as incoming("id", "title", "content", "rating", "reviewer_name", "reviewer_email", "product_id", "image_url", "source", "status", "verified_purchase", "created_at")
where not exists (
  select 1 from "review" existing
  where existing."source" = 'legacy'
    and existing."reviewer_name" = incoming."reviewer_name"
    and existing."content" = incoming."content"
    and coalesce(existing."image_url", '') = coalesce(incoming."image_url", '')
)
on conflict ("id") do nothing;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`delete from "review" where "source" = 'legacy';`)
  }
}
