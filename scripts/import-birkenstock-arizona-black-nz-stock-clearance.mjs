import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/birkenstock-arizona-black-nz-stock-clearance-report.json"

// No photos supplied yet - product is created as a draft with no images.
// Once photos arrive, upload them and PATCH the product with images + thumbnail + status: "published".
const IMAGE_PATHS = []

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM", // NZ Stock
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN", // NZ Stock
  category: "pcat_01KT3HVWSHGSW3S0CW47QYQS4E", // Sandals & Clogs
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WCMJA8D5AQKX88W0QZSDB", // birkenstock
  modelTag: "ptag_01KT3WN82S6SB8J6DAK8S8T158", // birkenstock-arizona
  blackTag: "ptag_01KTK0SR51P97PKDFT8C71GB7C", // colour:black
  saleTag: "ptag_01KT3W19BT07ANEQBF425WT73N", // sale
}

// No exact "Arizona - Black" (regular, non-soft footbed) counterpart exists in the
// catalog. Closest entries are "Arizona - Matte Black" (leather, regular footbed -
// used here only for the standard EU size run) and the separate "Arizona Birko-Flor
// - Black" NZ Stock listing (different material, already its own product). Neither
// is an exact match, so this is created as a standalone listing with partial colour
// confidence rather than being merged into either.
const REFERENCE_PRODUCT_ID = "prod_01KVMXQRH24XF3FWA2BA2HB99N"

const TITLE = "Birkenstock Arizona - Black"
const HANDLE = "birkenstock-arizona-black-nz-stock-clearance"
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-BIRKENSTOCK-ARIZONA-BLACK"
const PRICE = 100
const SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
const STOCK_BY_SIZE = {
  "37": 1,
}

const DESCRIPTION = `Birkenstock Arizona - Black brings Birkenstock's classic two-strap silhouette in a black colourway.

Two-strap sandal with adjustable buckles, Birkenstock's contoured cork-latex footbed (regular footbed, not the soft footbed version) and a lightweight EVA outsole.

A versatile everyday option that pairs easily with a relaxed, casual rotation.

This pair is NZ Stock and priced as Clearance. This is final sale clearance stock - no refunds or exchanges.`

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
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

const clearanceTag = await ensureTag("clearance")
const tagIds = [IDS.brandTag, IDS.modelTag, IDS.blackTag, IDS.saleTag, clearanceTag.id]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} (clearance) with ${SIZES.length} EU sizes, stock held only in size 37. No images supplied yet -> draft status.`)
console.log(`Reference product (read-only, not modified): ${REFERENCE_PRODUCT_ID}`)

if (dryRun) {
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
  subtitle: "Clearance - NZ Stock - Final Sale, No Refunds",
  handle: HANDLE,
  description: DESCRIPTION,
  status: imageUrls.length ? "published" : "draft",
  discountable: false,
  weight: 900,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZES }],
  variants: SIZES.map((size) => ({
    title: size,
    sku: `MUSE-NZ-BIRK-ARIZONA-BLACK-CLR-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: false,
    manage_inventory: true,
    weight: 900,
    options: { Size: size },
    prices: [
      { currency_code: "nzd", amount: PRICE },
      { currency_code: "usd", amount: PRICE },
      { currency_code: "eur", amount: PRICE },
    ],
    metadata: {
      eu_size: size,
      display_size: size,
      size_system: "eu",
      nz_stock_quantity: String(STOCK_BY_SIZE[size] || 0),
      availability_note: STOCK_BY_SIZE[size] ? "NZ stock - clearance, single unit" : "Out of stock",
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
    brand: "Birkenstock",
    model: "Arizona",
    colourway: "Black",
    full_colourway: "Black",
    colour_tags: "colour:black",
    colour_confidence: "partial",
    colour_source: "customer-provided description; no exact catalogue counterpart verified",
    footbed_type: "regular (non-soft footbed)",
    catalogue_note: "No existing catalogue counterpart for this exact listing - size run and weight follow the standard Birkenstock Arizona EU run used across other Arizona listings.",
    size_display_note: "Sizes are shown as EU buttons.",
    display_size_system: "eu",
    is_clearance: "true",
    return_policy: "final_sale_no_refunds",
    image_source: "pending - awaiting customer photos",
    clearance_price_nzd: String(PRICE),
    seo_title: "Birkenstock Arizona - Black | Clearance NZ Stock | MUSE",
    meta_description: "Clearance: Birkenstock Arizona in Black, regular (non-soft) footbed, NZ Stock size 37 EU. $100, final sale, no refunds.",
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

await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${product?.id}: ${product?.title} [status: ${product?.status}]`)
console.log(`Report: ${REPORT_PATH}`)
