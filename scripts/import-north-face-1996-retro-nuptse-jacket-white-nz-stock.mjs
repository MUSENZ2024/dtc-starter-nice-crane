import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/north-face-1996-retro-nuptse-jacket-white-nz-stock-report.json"

const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/IMG_9016 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9015 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9017 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9007 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9008 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9009 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9010 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9011 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9012 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9018 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9020 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9014 (1).jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9013 (1).jpeg",
]

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM", // NZ Stock
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN", // NZ Stock
  category: "pcat_01KT3HX8KBZGS9MRFV4SZJ0FJP", // Puffers
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3W23V2TYRE2W9SSRKJQ6NC", // the-north-face
  modelTag: "ptag_01KT3WK6W7KDQNN5CKTFA2T6FR", // the-north-face-full-jacket
  whiteTag: "ptag_01KTK0SS4R8Q5GND0N1GYJ9M22", // colour:white
  creamTag: "ptag_01KTK0T16H0P37V5JFZQHFTH3W", // colour:cream
  newArrivalTag: "ptag_01KT3W0ZJ80JWZTQD3TVHRD21Q", // new-arrival
}

// Reference only - never written to. Used purely to source the size run / weight
// for this brand's jackets so the new listing matches catalog conventions.
const REFERENCE_PRODUCT_ID = "prod_01KXZGMNFVMNHYN8MR5JPS4HQG"

const TITLE = "The North Face 1996 Retro Nuptse Jacket - White"
const HANDLE = "the-north-face-1996-retro-nuptse-jacket-white-nz-stock"
const EXTERNAL_ID = "NZSTOCK-TNF-NUPTSE-JACKET-WHITE-S"
const PRICE = 160
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL"]
const STOCK_BY_SIZE = {
  "S": 1,
}

const DESCRIPTION = `Inspired by the original 1996 Nuptse design, this jacket features the signature boxy silhouette that has become a staple in both streetwear and outdoor wear.

The white ripstop body is finished with a light cream yoke, lining and trim, plus tonal The North Face branding. The insulated puffer construction provides warmth without unnecessary bulk, while the stand collar, zipped hand pockets, adjustable cuffs and internal zip pocket add everyday function.

Finished with 700-fill branding on the sleeve and classic colour-blocked Nuptse styling.

NZ Stock. Labelled Men's Small.`

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) {
  throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
}

const authHeaders = { Authorization: `Basic ${apiKey}` }
const dryRun = process.argv.includes("--dry-run")

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(30000),
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  }
  return body
}

const listProducts = async () => {
  const products = []
  for (let offset = 0; offset < 4000; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,metadata`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) break
  }
  return products
}

const ensureTag = async (value) => {
  const body = await adminFetch("/admin/product-tags?limit=200")
  const tags = body.product_tags || body.tags || []
  const existing = tags.find((tag) => tag.value === value)
  if (existing) return existing
  if (dryRun) return { id: `dry-${value}`, value }
  const created = await adminFetch("/admin/product-tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value }),
  })
  return created.product_tag || created.tag
}

const uploadFile = async (filePath) => {
  const data = await fs.readFile(filePath)
  const form = new FormData()
  form.append("files", new File([data], path.basename(filePath), { type: "image/jpeg" }))
  const response = await fetch(`${BACKEND_URL}/admin/uploads`, {
    method: "POST",
    headers: authHeaders,
    body: form,
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  }
  return body.files[0]
}

const products = await listProducts()
const existing = products.find(
  (product) => product.handle === HANDLE || product.external_id === EXTERNAL_ID
)

if (existing) {
  console.log(`Skipped existing product: ${existing.id} ${existing.title}`)
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true })
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

const tagIds = [IDS.brandTag, IDS.modelTag, IDS.whiteTag, IDS.creamTag, IDS.newArrivalTag]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} with ${SIZES.length} sizes, stock held only in size S, and ${IMAGE_PATHS.length} images in supplied order.`)
console.log(`Reference product (read-only, not modified): ${REFERENCE_PRODUCT_ID}`)

if (dryRun) {
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true })
  await fs.writeFile(
    REPORT_PATH,
    JSON.stringify({ dry_run: true, title: TITLE, handle: HANDLE, sizes: SIZES, stock_by_size: STOCK_BY_SIZE, tag_ids: tagIds }, null, 2)
  )
  process.exit(0)
}

const files = []
for (const filePath of IMAGE_PATHS) {
  files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
}
const imageUrls = files.map((file) => file.url)

const payload = {
  title: TITLE,
  subtitle: "NZ Stock - White / Light Cream",
  handle: HANDLE,
  description: DESCRIPTION,
  status: imageUrls.length ? "published" : "draft",
  discountable: true,
  weight: 600,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZES }],
  variants: SIZES.map((size) => ({
    title: size,
    sku: `MUSE-NZ-TNF-NUPTSE-WHITE-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: false,
    manage_inventory: true,
    weight: 600,
    options: { Size: size },
    prices: [
      { currency_code: "nzd", amount: PRICE },
      { currency_code: "usd", amount: PRICE },
      { currency_code: "eur", amount: PRICE },
    ],
    metadata: {
      display_size: size,
      size_system: "us_unisex",
      nz_stock_quantity: String(STOCK_BY_SIZE[size] || 0),
      availability_note: STOCK_BY_SIZE[size] ? "NZ stock - single unit" : "Out of stock",
    },
  })),
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  categories: [{ id: IDS.category }],
  type_id: IDS.productType,
  tags: tagIds.map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock",
    stock_source: "nz_stock",
    reference_product_id: REFERENCE_PRODUCT_ID,
    brand: "The North Face",
    model: "1996 Retro Nuptse Jacket",
    colourway: "White",
    full_colourway: "White / Light Cream",
    colour_tags: "colour:white,colour:cream",
    colour_confidence: "verified",
    size_display_note: "US unisex sizing. Labelled size S (Men's Small).",
    display_size_system: "us_unisex",
    condition: "New",
    image_source: "user-supplied product photos",
    price_nzd: String(PRICE),
    seo_title: "The North Face 1996 Retro Nuptse Jacket - White | NZ Stock | MUSE",
    meta_description: "The North Face 1996 Retro Nuptse Jacket in White with light cream details. NZ Stock, size Small. $160.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*tags,metadata", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
})

const product = created.product

for (const variant of product?.variants || []) {
  const size = String(variant.title)
  const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
  if (!itemId) throw new Error(`${product.id}/${variant.id}: inventory item was not created`)
  await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ location_id: IDS.aucklandLocation, stocked_quantity: STOCK_BY_SIZE[size] || 0 }),
  })
}

const report = {
  created_at: new Date().toISOString(),
  product_id: product?.id,
  title: product?.title,
  handle: product?.handle,
  external_id: product?.external_id,
  status: product?.status,
  image_count: product?.images?.length,
  variant_count: product?.variants?.length,
  variants: product?.variants?.map((variant) => ({
    id: variant.id,
    title: variant.title,
    sku: variant.sku,
    manage_inventory: variant.manage_inventory,
    allow_backorder: variant.allow_backorder,
    stocked_quantity: STOCK_BY_SIZE[variant.title] || 0,
  })),
  tags: product?.tags?.map((tag) => tag.value),
  files,
}

await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true })
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${product?.id}: ${product?.title} [status: ${product?.status}]`)
console.log(`Report: ${REPORT_PATH}`)
