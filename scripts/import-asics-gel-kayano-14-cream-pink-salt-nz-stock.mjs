import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/asics-gel-kayano-14-cream-pink-salt-nz-stock-report.json"

const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/IMG_8245.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8246.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8247.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8248.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8249.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8250.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8251.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8252.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8253.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8254.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8255.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8256.jpeg",
]

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM", // NZ Stock
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN", // NZ Stock
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8", // Sneakers
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WBGRY1SAJZC635R9S9S4E", // asics
  modelTag: "ptag_01KT3WHJYJR1ECDCBASYR1QP6J", // asics-gel-kayano-14
  creamTag: "ptag_01KTK0T16H0P37V5JFZQHFTH3W", // colour:cream
  pinkTag: "ptag_01KTK0T683H8S8P8N57HWZ15QH", // colour:pink
}

const STANDARD_PRODUCT_ID = "prod_01KVA3PS0ZBCG2RSK7MCC8X0Z0" // Standard Delivery counterpart, same style code

const TITLE = "ASICS Gel-Kayano 14 - Cream Pink Salt"
const HANDLE = "asics-gel-kayano-14-cream-pink-salt-nz-stock"
const EXTERNAL_ID = "NZSTOCK-ASICS-GEL-KAYANO-14-CREAM-PINK-SALT"
const STYLE_CODE = "1202A105-100"
const PRICE = 160
const SIZES = [
  "36", "37", "37.5", "38", "39", "39.5", "40", "40.5",
  "41.5", "42", "42.5", "43.5", "44", "44.5", "45", "46", "46.5", "47",
]
const STOCK_BY_SIZE = {
  "40": 1,
}

const DESCRIPTION = `The ASICS Gel-Kayano 14 blends technical running heritage with a soft, lifestyle-ready finish. Originally designed for performance, this silhouette has become a modern staple thanks to its layered construction, supportive feel, and distinctive early-2000s design language.

The Cream Pink Salt colourway introduces a subtle warmth to the shoe, combining breathable mesh with smooth overlays for a balanced, refined look. Underfoot, ASICS' signature GEL cushioning provides lasting comfort and stability, making this pair ideal for long days on your feet.

Comfort-driven yet visually understated, the Gel-Kayano 14 is a versatile option that moves easily between everyday wear and elevated casual styling.

This pair is NZ Stock, held locally in a single verified size and ready for faster Auckland dispatch.`

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

const tagIds = [IDS.brandTag, IDS.modelTag, IDS.creamTag, IDS.pinkTag]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} with ${SIZES.length} EU sizes, stock held only in size 40.`)

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
  subtitle: "NZ Stock - Ships in 1-3 days from Auckland",
  handle: HANDLE,
  description: DESCRIPTION,
  status: "published",
  discountable: true,
  weight: 400,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZES }],
  variants: SIZES.map((size) => ({
    title: size,
    sku: `MUSE-NZ-ASICS-GK14-CREAMPINKSALT-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
      availability_note: STOCK_BY_SIZE[size] ? "NZ stock" : "Out of stock",
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
    colourway: "Cream Pink Salt",
    full_colourway: "Cream / Pink Salt",
    colour_tags: "colour:cream | colour:pink",
    colour_confidence: "verified",
    colour_source: "StockX / product packaging",
    size_chart: "asics-adult",
    image_source: "local customer photos",
    seo_title: "ASICS Gel-Kayano 14 - Cream Pink Salt | NZ Stock | MUSE",
    meta_description: "Shop the ASICS Gel-Kayano 14 in Cream Pink Salt (1202A105-100). NZ Stock, size 40 EU, ready for fast Auckland dispatch.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,thumbnail,*images,*variants,*variants.inventory_items,*tags,metadata", {
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
console.log(`Created ${product?.id}: ${product?.title}`)
console.log(`Report: ${REPORT_PATH}`)
