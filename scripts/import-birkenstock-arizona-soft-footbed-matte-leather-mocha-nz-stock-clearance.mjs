import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/birkenstock-arizona-soft-footbed-matte-leather-mocha-nz-stock-clearance-report.json"

const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/IMG_8337.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8346.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8345.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8344.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8343.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8341.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8342.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8340.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8339.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8338.jpeg",
]

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM", // NZ Stock
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN", // NZ Stock
  category: "pcat_01KT3HVWSHGSW3S0CW47QYQS4E", // Sandals & Clogs
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WCMJA8D5AQKX88W0QZSDB", // birkenstock
  modelTag: "ptag_01KT3WN82S6SB8J6DAK8S8T158", // birkenstock-arizona
  brownTag: "ptag_01KTK0T39BAKFZMGCAB2TWM79E", // colour:brown
  saleTag: "ptag_01KT3W19BT07ANEQBF425WT73N", // sale
}

// Reference only - never written to. This preserves the established Arizona EU size run,
 // taxonomy and size-display system while this separate NZ Stock clearance listing
 // represents the physically verified soft-footbed matte-leather pair.
const REFERENCE_PRODUCT_ID = "prod_01KVMXFJCW4KF6RNDZT8YK0EH6"

const TITLE = "Birkenstock Arizona Soft Footbed Matte Leather - Mocha"
const HANDLE = "birkenstock-arizona-soft-footbed-matte-leather-mocha-eu43-nz-stock-clearance"
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-BIRKENSTOCK-ARIZONA-SFB-MATTE-LEATHER-MOCHA-43"
const PRICE = 100
const SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
const STOCK_BY_SIZE = {
  "43": 1,
}

const DESCRIPTION = `Birkenstock Arizona Soft Footbed Matte Leather - Mocha brings Birkenstock's classic two-strap silhouette in a smooth matte mocha-brown finish.

The matte leather upper features two individually adjustable straps with metal pin buckles, allowing the fit to be tuned across the foot.

Underfoot, the soft footbed adds an integrated foam layer above Birkenstock's contoured cork-latex base, providing extra cushioning while retaining the supportive shape of the original Arizona. A lightweight EVA outsole completes the everyday sandal.

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
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true })
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

const clearanceTag = await ensureTag("clearance")
const tagIds = [IDS.brandTag, IDS.modelTag, IDS.brownTag, IDS.saleTag, clearanceTag.id]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} (clearance) with ${SIZES.length} EU sizes, stock held only in size 43, with ${IMAGE_PATHS.length} images in the supplied order.`)
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
    sku: `MUSE-NZ-BIRK-ARIZONA-MOCHA-MATTE-SFB-CLR-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
    colourway: "Mocha",
    full_colourway: "Mocha Matte Leather",
    primary_colour: "Brown",
    colour_tags: "colour:brown",
    colour_confidence: "verified from customer-provided photos and description",
    colour_source: "customer-provided product photography and description",
    material: "Matte Leather",
    upper_material: "Matte Leather",
    footbed: "Soft Footbed",
    footbed_type: "soft footbed",
    catalogue_note: "Separate NZ Stock clearance listing. Existing Arizona Mocha, Mocha Leather, and Mocha Suede products were preserved.",
    size_display_note: "Sizes are shown as EU buttons.",
    display_size_system: "eu",
    is_clearance: "true",
    return_policy: "final_sale_no_refunds",
    image_source: "customer-provided product photography",
    image_source_policy: "Customer-provided product photography only",
    customer_image_count: IMAGE_PATHS.length,
    customer_image_files: IMAGE_PATHS.map((filePath) => path.basename(filePath)).join(" | "),
    clearance_price_nzd: String(PRICE),
    seo_title: "Birkenstock Arizona Soft Footbed Matte Leather - Mocha | Clearance NZ Stock | MUSE",
    meta_description: "Clearance Birkenstock Arizona Soft Footbed Matte Leather in Mocha. NZ Stock, EU size 43, $100 final sale. Adjustable double straps and cushioned soft footbed.",
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
