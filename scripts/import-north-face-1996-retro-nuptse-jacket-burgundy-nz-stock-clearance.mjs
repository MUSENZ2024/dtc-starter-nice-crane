import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/north-face-1996-retro-nuptse-jacket-burgundy-nz-stock-clearance-report.json"
const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/IMG_9172.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9173.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9174.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9175.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9176.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9177.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9178.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9179.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9180.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_9182.jpeg",
]
const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  category: "pcat_01KT3HX8KBZGS9MRFV4SZJ0FJP",
  location: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3W23V2TYRE2W9SSRKJQ6NC",
  modelTag: "ptag_01KT3WK6W7KDQNN5CKTFA2T6FR",
  saleTag: "ptag_01KT3W19BT07ANEQBF425WT73N",
}
const REFERENCE_PRODUCT_ID = "prod_01KXZGMNFVMNHYN8MR5JPS4HQG"
const TITLE = "The North Face 1996 Retro Nuptse Jacket - Burgundy"
const HANDLE = "north-face-1996-retro-nuptse-jacket-burgundy-nz-stock-clearance"
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-TNF-1996-NUPTSE-BURGUNDY-XS"
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL"]
const STOCK = { XS: 1 }
const PRICE = 120
const DESCRIPTION = `Inspired by the original 1996 Nuptse design, this jacket features a boxy, oversized silhouette that has become a staple in both streetwear and outdoor wear.

Constructed with a durable ripstop outer, it offers reliable protection against everyday wear while maintaining a lightweight and comfortable feel. The burgundy colourway gives the classic design a rich, versatile finish.

Filled with high-quality insulation, it provides exceptional warmth without unnecessary bulk, making it ideal for colder conditions while still being versatile enough for daily wear.

Finished with signature The North Face branding and a classic puffer construction, this jacket delivers a strong balance of function, warmth, and timeless design.

Clearance condition: this jacket was expected to arrive in mocha brown, but the actual colour is more burgundy. It is therefore listed as a colour mismatch. The jacket is unworn and has no other known irregularities.`

const dryRun = process.argv.includes("--dry-run")
const env = await fs.readFile(ENV_PATH, "utf8")
const key = env.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!key?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${key}` }

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
  return body
}

const listProducts = async () => {
  const products = []
  for (let offset = 0; offset < 5000; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) break
  }
  return products
}

const ensureTag = async (value) => {
  const body = await adminFetch("/admin/product-tags?limit=500")
  const existing = (body.product_tags || body.tags || []).find((tag) => tag.value === value)
  if (existing) return existing
  if (dryRun) return { id: `dry-${value}`, value }
  const created = await adminFetch("/admin/product-tags", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }),
  })
  return created.product_tag || created.tag
}

const upload = async (filePath) => {
  const form = new FormData()
  form.append("files", new File([await fs.readFile(filePath)], path.basename(filePath), { type: "image/jpeg" }))
  const response = await fetch(`${BACKEND_URL}/admin/uploads`, { method: "POST", headers: authHeaders, body: form })
  const body = await response.json()
  if (!response.ok) throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body.files[0]
}

for (const imagePath of IMAGE_PATHS) await fs.access(imagePath)
const existing = (await listProducts()).find((p) => p.handle === HANDLE || p.external_id === EXTERNAL_ID)
if (existing) {
  console.log(`Skipped existing product: ${existing.id} ${existing.title}`)
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

const [clearanceTag, burgundyTag] = await Promise.all([
  ensureTag("clearance"), ensureTag("colour:burgundy"),
])
const tagIds = [IDS.brandTag, IDS.modelTag, IDS.saleTag, clearanceTag.id, burgundyTag.id]
console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`${TITLE}; ${SIZES.length} sizes; XS stock 1; ${IMAGE_PATHS.length} ordered photos; NZ$${PRICE}.`)
if (dryRun) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({ dry_run: true, title: TITLE, handle: HANDLE, price_nzd: PRICE, sizes: SIZES, stock_by_size: STOCK, image_paths: IMAGE_PATHS, tag_ids: tagIds }, null, 2))
  process.exit(0)
}

const files = []
for (const imagePath of IMAGE_PATHS) files.push({ local_path: imagePath, ...(await upload(imagePath)) })
const urls = files.map((file) => file.url)
const payload = {
  title: TITLE,
  subtitle: "Clearance - NZ Stock - Colour Mismatch - Unworn",
  handle: HANDLE,
  external_id: EXTERNAL_ID,
  description: DESCRIPTION,
  status: "published",
  discountable: false,
  weight: 600,
  thumbnail: urls[0],
  images: urls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZES }],
  variants: SIZES.map((size) => ({
    title: size,
    sku: `MUSE-NZ-TNF-NUPTSE-BURGUNDY-CLR-${size}`,
    allow_backorder: false,
    manage_inventory: true,
    weight: 600,
    options: { Size: size },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
    metadata: {
      display_size: size,
      size: size,
      size_system: "us_unisex",
      colour: "Burgundy",
      nz_stock_quantity: String(STOCK[size] || 0),
      availability_note: STOCK[size] ? "NZ stock - clearance, single unit" : "Out of stock",
    },
  })),
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  type_id: IDS.productType,
  categories: [{ id: IDS.category }],
  tags: tagIds.map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock",
    stock_source: "nz_stock",
    reference_product_id: REFERENCE_PRODUCT_ID,
    brand: "The North Face",
    model: "1996 Retro Nuptse Jacket",
    colourway: "Burgundy",
    full_colourway: "Burgundy",
    expected_colour: "Mocha Brown",
    actual_colour: "Burgundy",
    colour_tags: "colour:burgundy",
    colour_confidence: "verified_from_user_supplied_photos",
    size_display_note: "US unisex sizing. Labelled Men's XS (Asia S).",
    display_size_system: "us_unisex",
    is_clearance: "true",
    condition: "Unworn - colour mismatch only",
    clearance_reason: "Expected mocha brown; actual colour is more burgundy",
    condition_note: "Unworn condition with no other known irregularities",
    image_source: "user-supplied product photos",
    clearance_price_nzd: String(PRICE),
    seo_title: "The North Face 1996 Retro Nuptse Jacket - Burgundy | Clearance NZ Stock | MUSE",
    meta_description: "Clearance The North Face 1996 Retro Nuptse Jacket in burgundy, NZ Stock men's size XS. Unworn; reduced to $120 due to a colour mismatch from the expected mocha brown.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*tags,*categories,*collection,*type,metadata", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
})
const product = created.product
for (const variant of product.variants || []) {
  const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
  if (!itemId) throw new Error(`${variant.id}: inventory item missing`)
  await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ location_id: IDS.location, stocked_quantity: STOCK[variant.title] || 0 }),
  })
}

const report = {
  created_at: new Date().toISOString(), product_id: product.id, title: product.title, handle: product.handle,
  status: product.status, price_nzd: PRICE, image_count: product.images?.length, image_urls: product.images?.map((image) => image.url),
  variant_count: product.variants?.length, variants: product.variants?.map((v) => ({ id: v.id, title: v.title, sku: v.sku, stocked_quantity: STOCK[v.title] || 0 })),
  tags: product.tags?.map((tag) => tag.value), category: product.categories?.map((category) => category.name), collection: product.collection?.title,
  type: product.type?.value, metadata: product.metadata, files,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${product.id}: ${product.title}`)
console.log(`Report: ${REPORT_PATH}`)
