import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const OUT_DIR =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/squarespace-image-migration"
const REPORT_PATH = path.join(OUT_DIR, "squarespace-image-migration-report.json")
const REVIEW_PATH = path.join(OUT_DIR, "squarespace-image-migration-review.csv")
const SQUARESPACE_HOST = "images.squarespace-cdn.com"
const APPLY = process.argv.includes("--apply")
const ONLY_HANDLE = process.argv
  .find((arg) => arg.startsWith("--only-handle="))
  ?.slice("--only-handle=".length)

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const isSquarespaceUrl = (value) => {
  try {
    return new URL(value).hostname === SQUARESPACE_HOST
  } catch {
    return false
  }
}

const unique = (values) => [...new Set(values.filter(Boolean))]

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]

if (!apiKey?.startsWith("sk_")) {
  throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
}

const authHeaders = { Authorization: `Basic ${apiKey}` }

async function adminFetch(route, options = {}) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(`${BACKEND_URL}${route}`, {
      ...options,
      headers: { ...authHeaders, ...(options.headers || {}) },
      signal: AbortSignal.timeout(90_000),
    })
    const text = await response.text()
    let body

    try {
      body = text ? JSON.parse(text) : {}
    } catch {
      body = { raw: text }
    }

    if (response.ok) {
      return body
    }

    if (attempt === 4 || ![408, 429, 500, 502, 503, 504].includes(response.status)) {
      throw new Error(
        `${options.method || "GET"} ${route} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`
      )
    }

    await wait(attempt * 2_000)
  }
}

async function listAllProducts() {
  const products = []
  const limit = 100

  for (let offset = 0; ; offset += limit) {
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      fields: "id,title,handle,thumbnail,*images,metadata,*variants.images",
    })
    const body = await adminFetch(`/admin/products?${query.toString()}`)
    products.push(...(body.products || []))

    if (!body.products?.length || products.length >= (body.count || 0)) {
      return products
    }
  }
}

function getProductSquarespaceUrls(product) {
  const thumbnailUrls = [product.thumbnail].filter(isSquarespaceUrl)
  const productImageUrls = (product.images || [])
    .map((image) => image.url)
    .filter(isSquarespaceUrl)
  const variantImageUrls = (product.variants || [])
    .flatMap((variant) => variant.images || [])
    .map((image) => image.url)
    .filter(isSquarespaceUrl)

  return {
    thumbnailUrls,
    productImageUrls,
    variantImageUrls,
    allUrls: unique([...thumbnailUrls, ...productImageUrls, ...variantImageUrls]),
  }
}

function extensionFor(contentType, url) {
  if (contentType.includes("png")) return "png"
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("avif")) return "avif"
  if (contentType.includes("gif")) return "gif"

  try {
    const ext = path.extname(new URL(url).pathname).replace(".", "").toLowerCase()
    return ext && ext.length <= 5 ? ext : "jpg"
  } catch {
    return "jpg"
  }
}

async function uploadUrl(url, index, handle) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const source = await fetch(url, { signal: AbortSignal.timeout(60_000) })

      if (!source.ok) {
        throw new Error(`Squarespace download failed ${source.status}`)
      }

      const contentType = source.headers.get("content-type") || "image/jpeg"
      const extension = extensionFor(contentType, url)
      const bytes = await source.arrayBuffer()
      const form = new FormData()

      form.append(
        "files",
        new File([bytes], `squarespace-migration-${handle}-${index + 1}.${extension}`, {
          type: contentType,
        })
      )

      const body = await adminFetch("/admin/uploads", {
        method: "POST",
        body: form,
      })
      const uploadedUrl = body.files?.[0]?.url

      if (uploadedUrl) {
        return uploadedUrl
      }

      throw new Error("Medusa upload returned no file URL")
    } catch (error) {
      if (attempt === 4) {
        throw new Error(`${url}: ${error.message}`)
      }

      await wait(attempt * 2_000)
    }
  }
}

await fs.mkdir(OUT_DIR, { recursive: true })

const products = await listAllProducts()
const candidates = products
  .filter((product) => !ONLY_HANDLE || product.handle === ONLY_HANDLE)
  .map((product) => ({ product, source: getProductSquarespaceUrls(product) }))
  .filter(({ source }) => source.allUrls.length)

const report = {
  started_at: new Date().toISOString(),
  dry_run: !APPLY,
  backend_url: BACKEND_URL,
  total_products_scanned: products.length,
  products_with_squarespace_images: candidates.length,
  unique_squarespace_urls: unique(candidates.flatMap(({ source }) => source.allUrls)).length,
  updated: [],
  failed: [],
}

const review = [
  [
    "status",
    "product_id",
    "handle",
    "title",
    "thumbnail_squarespace_count",
    "product_image_squarespace_count",
    "variant_image_squarespace_count",
    "unique_squarespace_count",
    "uploaded_count",
    "notes",
  ],
]

await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))

for (const { product, source } of candidates) {
  const uploadedBySource = new Map()

  try {
    if (APPLY) {
      for (const [index, url] of source.allUrls.entries()) {
        uploadedBySource.set(url, await uploadUrl(url, index, product.handle))
      }

      const updatedImageUrls = (product.images || [])
        .map((image) => uploadedBySource.get(image.url) || image.url)
        .filter(Boolean)
      const imageUrls = updatedImageUrls.length
        ? updatedImageUrls
        : source.allUrls.map((url) => uploadedBySource.get(url)).filter(Boolean)
      const thumbnail =
        uploadedBySource.get(product.thumbnail) ||
        imageUrls[0] ||
        product.thumbnail ||
        null

      await adminFetch(`/admin/products/${product.id}?fields=id,title,handle,thumbnail,*images,metadata,*variants.images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          thumbnail,
          images: imageUrls.map((url) => ({ url })),
          metadata: {
            ...(product.metadata || {}),
            squarespace_image_migrated_at: new Date().toISOString(),
            squarespace_image_migration_source_host: SQUARESPACE_HOST,
            squarespace_image_migration_source_count: source.allUrls.length,
            image_source_policy: "Medusa-hosted uploads only",
          },
        }),
      })
    }

    const record = {
      product_id: product.id,
      handle: product.handle,
      title: product.title,
      thumbnail_squarespace_count: source.thumbnailUrls.length,
      product_image_squarespace_count: source.productImageUrls.length,
      variant_image_squarespace_count: source.variantImageUrls.length,
      unique_squarespace_count: source.allUrls.length,
      uploaded_count: uploadedBySource.size,
      status: APPLY ? "updated" : "dry_run",
    }

    report.updated.push(record)
    review.push([
      record.status,
      product.id,
      product.handle,
      product.title,
      source.thumbnailUrls.length,
      source.productImageUrls.length,
      source.variantImageUrls.length,
      source.allUrls.length,
      uploadedBySource.size,
      APPLY ? "Uploaded to Medusa and replaced product images." : "Would upload and replace product images.",
    ])
    console.log(`${record.status}: ${product.handle} (${source.allUrls.length} unique source URLs)`)
  } catch (error) {
    const record = {
      product_id: product.id,
      handle: product.handle,
      title: product.title,
      status: "failed",
      error: error.message,
      unique_squarespace_count: source.allUrls.length,
    }

    report.failed.push(record)
    review.push([
      "failed",
      product.id,
      product.handle,
      product.title,
      source.thumbnailUrls.length,
      source.productImageUrls.length,
      source.variantImageUrls.length,
      source.allUrls.length,
      uploadedBySource.size,
      error.message,
    ])
    console.error(`failed: ${product.handle}: ${error.message}`)
  }

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  await fs.writeFile(REVIEW_PATH, review.map((row) => row.map(csvEscape).join(",")).join("\n"))
}

report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
await fs.writeFile(REVIEW_PATH, review.map((row) => row.map(csvEscape).join(",")).join("\n"))

console.log(`Products scanned: ${report.total_products_scanned}`)
console.log(`Products with Squarespace images: ${report.products_with_squarespace_images}`)
console.log(`Unique Squarespace URLs: ${report.unique_squarespace_urls}`)
console.log(`Updated/dry-run: ${report.updated.length}`)
console.log(`Failed: ${report.failed.length}`)
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
