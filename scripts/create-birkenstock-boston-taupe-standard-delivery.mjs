import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const SOURCE_PRODUCT_ID = "prod_01KVAEDK3AM5QAA1PZG6479YH2"
const HANDLE = "birkenstock-boston-soft-footbed-suede-taupe"
const EXTERNAL_ID = "STANDARD-BIRKENSTOCK-BOSTON-SOFT-FOOTBED-SUEDE-TAUPE"
const REPORT_PATH = path.resolve("../medusa-imports/birkenstock-boston-taupe-standard-delivery-report.json")
const dryRun = process.argv.includes("--dry-run")

const IDS = {
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
}

const DESCRIPTION = `The Birkenstock Boston Soft Footbed Suede Taupe is the classic year-round clog in Birkenstock's most wearable neutral colourway.

The taupe suede upper gives the Boston its relaxed texture, while the adjustable strap and metal pin buckle let you fine-tune the fit across the instep.

Underfoot, the soft footbed adds an integrated foam layer above Birkenstock's contoured cork-latex base, giving the clog a cushioned feel that still shapes naturally with wear.

The lightweight EVA outsole keeps the Boston easy for everyday use, with the signature cork sidewall and rounded closed toe making it one of Birkenstock's most recognisable silhouettes.`

const apiKey = (await fs.readFile(ENV_PATH, "utf8")).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { Authorization: `Basic ${apiKey}`, ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
  return body
}

const source = (await adminFetch(`/admin/products/${SOURCE_PRODUCT_ID}?fields=id,title,subtitle,description,handle,external_id,status,discountable,weight,thumbnail,*images,*variants,*variants.prices,*variants.options,*options,*tags,*categories,*collection,*type,*sales_channels,shipping_profile_id,metadata`)).product
if (!source) throw new Error(`Source product not found: ${SOURCE_PRODUCT_ID}`)

const existing = (await adminFetch(`/admin/products?handle=${encodeURIComponent(HANDLE)}&fields=id,title,handle,external_id,status,*variants,*variants.prices,*tags,*categories,*collection,*type`)).products || []
if (existing.length) {
  const report = { skipped: true, reason: "existing_standard_delivery_product", product: existing[0] }
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  process.exit(0)
}

const sizes = source.variants
  .map((variant) => variant.options?.find((option) => option.option?.title === "Size" || option.value)?.value || variant.title)
  .sort((a, b) => Number(a) - Number(b))

const payload = {
  title: source.title,
  subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
  handle: HANDLE,
  description: DESCRIPTION,
  status: "published",
  discountable: source.discountable,
  weight: source.weight,
  external_id: EXTERNAL_ID,
  thumbnail: source.thumbnail,
  images: source.images.map(({ url }) => ({ url })),
  options: [{ title: "Size", values: sizes }],
  variants: source.variants
    .sort((a, b) => Number(a.title) - Number(b.title))
    .map((variant) => ({
      title: variant.title,
      sku: `MUSE-BIRK-BOSTON-TAUPE-${variant.title}`,
      allow_backorder: true,
      manage_inventory: false,
      weight: variant.weight || source.weight,
      options: { Size: variant.title },
      prices: variant.prices.map(({ currency_code, amount }) => ({ currency_code, amount })),
      metadata: { eu_size: variant.title, display_size: variant.title, size_system: "eu" },
    })),
  shipping_profile_id: source.shipping_profile_id,
  collection_id: IDS.collection,
  categories: source.categories.map(({ id }) => ({ id })),
  type_id: IDS.productType,
  tags: source.tags.map(({ id }) => ({ id })),
  sales_channels: source.sales_channels.map(({ id }) => ({ id })),
  metadata: {
    ...source.metadata,
    source: "standard_delivery_counterpart",
    stock_source: "standard_delivery",
    counterpart_product_id: SOURCE_PRODUCT_ID,
    availability_note: "All sizes available; inventory is not tracked.",
  },
}

if (dryRun) {
  const report = { dry_run: true, source_product_id: source.id, source_unchanged: true, payload }
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ dry_run: true, title: payload.title, handle: payload.handle, sizes, image_count: payload.images.length, tags: source.tags.map((tag) => tag.value), categories: source.categories.map((category) => category.name), collection_id: payload.collection_id, type_id: payload.type_id }, null, 2))
  process.exit(0)
}

const created = (await adminFetch("/admin/products?fields=id,title,handle,external_id,status,description,subtitle,thumbnail,*images,*variants,*variants.prices,*variants.options,*variants.inventory_items,*tags,*categories,*collection,*type,*sales_channels,metadata", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
})).product

const report = {
  created_at: new Date().toISOString(),
  source_product_id: source.id,
  source_unchanged: true,
  product: created,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ id: created.id, title: created.title, handle: created.handle, status: created.status, collection: created.collection?.title, type: created.type?.value, categories: created.categories?.map((category) => category.name), tags: created.tags?.map((tag) => tag.value), variant_count: created.variants?.length, sizes: created.variants?.map((variant) => variant.title), inventory_tracking: created.variants?.map((variant) => variant.manage_inventory), image_count: created.images?.length }, null, 2))
