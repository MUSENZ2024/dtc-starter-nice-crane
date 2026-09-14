import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/asics-gel-kayano-14-white-dark-grape-nz-stock-clearance-report.json"

// No photos supplied yet - product is created as a draft with no images.
// Once photos arrive, upload them and PATCH the product with images + thumbnail + status: "published".
const IMAGE_PATHS = []

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM", // NZ Stock
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN", // NZ Stock
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8", // Sneakers
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WBGRY1SAJZC635R9S9S4E", // asics
  modelTag: "ptag_01KT3WHJYJR1ECDCBASYR1QP6J", // asics-gel-kayano-14
  whiteTag: "ptag_01KTK0SS4R8Q5GND0N1GYJ9M22", // colour:white
  purpleTag: "ptag_01KTK0T55T6BAQ7VXYTHXRKE9S", // colour:purple
  greyTag: "ptag_01KTK0SY4FX25YG2EGSCF492ZT", // colour:grey
  blackTag: "ptag_01KTK0SR51P97PKDFT8C71GB7C", // colour:black
  silverTag: "ptag_01KTK0SZ2015C5CVST8ME9TG9K", // colour:silver
  saleTag: "ptag_01KT3W19BT07ANEQBF425WT73N", // sale
}

const STANDARD_PRODUCT_ID = "prod_01KVA3JCCJGF9DBFDXH3S5BNAK" // Standard Delivery counterpart, same style code/colourway

const TITLE = "ASICS Gel-Kayano 14 - White Dark Grape"
const HANDLE = "asics-gel-kayano-14-white-dark-grape-nz-stock-clearance"
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-ASICS-GEL-KAYANO-14-WHITE-DARK-GRAPE"
const STYLE_CODE = "1202A056-111"
const PRICE = 120
const STANDARD_PRICE = 160
const SIZES = [
  "36", "37", "37.5", "38", "39", "39.5", "40", "40.5",
  "41.5", "42", "42.5", "43.5", "44", "44.5", "45", "46", "46.5", "47",
]
const STOCK_BY_SIZE = {
  "40": 1,
}

const DESCRIPTION = `The ASICS Gel-Kayano 14 White Dark Grape takes inspiration from early 2000s performance runners, blending technical design with modern everyday wearability.

Constructed with breathable mesh underlays and layered synthetic overlays, the sneaker delivers a lightweight feel while maintaining structure and support. The White Dark Grape colourway pairs metallic silver detailing with rich purple accents for a clean yet standout finish.

Equipped with ASICS GEL cushioning technology, the Gel-Kayano 14 provides all-day comfort and shock absorption, making it ideal for daily wear, casual styling, and long hours on foot.

Finished with signature ASICS branding, a sculpted midsole, and retro runner proportions, this silhouette has become one of the most sought-after sneakers in the current tech-runner trend.

This pair is NZ Stock and priced as Clearance. Please note: sizing runs small on this pair - while labelled EU 40, it fits closer to EU 39.5, so it will feel tighter than a true 40. This is final sale clearance stock - no refunds or exchanges.`

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

const tagIds = [IDS.brandTag, IDS.modelTag, IDS.whiteTag, IDS.purpleTag, IDS.greyTag, IDS.blackTag, IDS.silverTag, IDS.saleTag]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} (clearance) with ${SIZES.length} EU sizes, stock held only in size 40. No images supplied yet -> draft status.`)

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
  subtitle: "Clearance - NZ Stock - Final Sale, No Refunds - Runs Small (fits closer to 39.5)",
  handle: HANDLE,
  description: DESCRIPTION,
  status: imageUrls.length ? "published" : "draft",
  discountable: false,
  weight: 400,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZES }],
  variants: SIZES.map((size) => ({
    title: size,
    sku: `MUSE-NZ-ASICS-GK14-WHITEDARKGRAPE-CLR-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: false,
    manage_inventory: true,
    weight: 400,
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
      availability_note: STOCK_BY_SIZE[size] ? "NZ stock - clearance" : "Out of stock",
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
    standard_product_id: STANDARD_PRODUCT_ID,
    brand: "ASICS",
    model: "ASICS Gel-Kayano 14",
    product_code: STYLE_CODE,
    style_code: STYLE_CODE,
    colourway: "White Dark Grape",
    full_colourway: "White / Dark Grape",
    colour_tags: "colour:white | colour:purple | colour:grey | colour:black | colour:silver",
    colour_confidence: "verified",
    colour_source: "StockX / matched to existing catalogue listing 1202A056-111",
    size_chart: "asics-adult",
    image_source: "pending - awaiting customer photos",
    is_clearance: "true",
    clearance_reason: "Runs small / tighter fit than labelled size",
    fit_note: "Labelled EU 40 but fits closer to EU 39.5 - tighter than a true 40",
    return_policy: "final_sale_no_refunds",
    standard_price_nzd: String(STANDARD_PRICE),
    clearance_price_nzd: String(PRICE),
    seo_title: "ASICS Gel-Kayano 14 - White Dark Grape | Clearance NZ Stock | MUSE",
    meta_description: "Clearance: ASICS Gel-Kayano 14 White Dark Grape (1202A056-111), NZ Stock size 40 EU (fits closer to 39.5). $120, final sale, no refunds.",
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
