import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/salomon-xt-6-white-nz-stock-report.json"
const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/IMG_8413.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8414.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8415.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8416.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8417.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8418.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8419.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8420.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8421.jpeg",
]
const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  location: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WAPFHPDG8M6T1RQPR00B0",
  lineTag: "ptag_01KT3WFPEVSYANMV1Z03E8MJ6F",
  whiteTag: "ptag_01KTK0SS4R8Q5GND0N1GYJ9M22",
}
const REFERENCE_PRODUCT_ID = "prod_01KYBQPD415V3QEHZZKWWEQKXH"
const TITLE = "Salomon XT-6 - White"
const HANDLE = "salomon-xt-6-white-nz-stock"
const EXTERNAL_ID = "NZSTOCK-SALOMON-XT6-412529-WHITE"
const PRICE = 170
const MEN_SIZES = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5"]
const label = (size) => `M ${size} / W ${Number(size) + 1.5}`
const STOCK = { "6": 1, "7": 1 }
const DESCRIPTION = `The Salomon XT-6 White brings trail-running performance to the street with its low-profile Agile Chassis System midsole, breathable Sensifit upper, and grippy Mud Contagrip outsole.

Originally built for ultra-distance trail running, the XT-6 has become one of the defining silhouettes of the current outdoor-to-street movement, prized for its lightweight cushioning and technical detailing.

The White colourway pairs technical materials with a wearable everyday palette, finished with the toggle Quicklace closure for a secure, laceless-look fit.

True to size for most buyers. See the size guide for full Men's/Women's/EU/CM/UK conversions.`

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

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`${TITLE}; ${MEN_SIZES.length} sizes; men's 6 and 7 stock 1 each; ${IMAGE_PATHS.length} ordered photos; NZ$${PRICE}.`)
if (dryRun) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({ dry_run: true, title: TITLE, handle: HANDLE, price_nzd: PRICE, size_labels: MEN_SIZES.map(label), stock_by_mens_size: STOCK, image_paths: IMAGE_PATHS }, null, 2))
  process.exit(0)
}

const files = []
for (const imagePath of IMAGE_PATHS) files.push({ local_path: imagePath, ...(await upload(imagePath)) })
const urls = files.map((file) => file.url)
const payload = {
  title: TITLE,
  subtitle: "NZ Stock - Ships in 1-3 days",
  handle: HANDLE,
  external_id: EXTERNAL_ID,
  description: DESCRIPTION,
  status: "published",
  discountable: true,
  weight: 900,
  thumbnail: urls[0],
  images: urls.map((url) => ({ url })),
  options: [{ title: "Size", values: MEN_SIZES.map(label) }],
  variants: MEN_SIZES.map((size) => ({
    title: label(size),
    sku: `MUSE-NZ-SALOMON-XT6-412529-${size}`,
    allow_backorder: false,
    manage_inventory: true,
    weight: 900,
    options: { Size: label(size) },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
    metadata: {
      display_size: label(size),
      mens_us: size,
      womens_us: String(Number(size) + 1.5),
      size_system: "salomon-us",
      nz_stock_quantity: String(STOCK[size] || 0),
      availability_note: STOCK[size] ? "NZ stock - single unit" : "Out of stock",
    },
  })),
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  type_id: IDS.productType,
  categories: [{ id: IDS.category }],
  tags: [IDS.brandTag, IDS.lineTag, IDS.whiteTag].map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock",
    stock_source: "nz_stock",
    reference_product_id: REFERENCE_PRODUCT_ID,
    brand: "Salomon",
    model: "Salomon XT-6",
    product_code: "412529",
    corrected_product_code: "412529",
    colourway: "White",
    full_colourway: "White",
    colour_tags: "colour:white",
    colour_source: "user supplied title and photos",
    colour_confidence: "verified",
    size_display_note: "Sizes are shown as US Men's / US Women's.",
    display_size_system: "salomon-us",
    condition: "New",
    image_source: "user-supplied product photos",
    price_nzd: String(PRICE),
    seo_title: "Salomon XT-6 - White | NZ Stock | MUSE",
    meta_description: "Shop the Salomon XT-6 in White for NZ$170. NZ Stock in men's US sizes 6 and 7, with tracked dispatch from Auckland.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*tags,*categories,*collection,*type,metadata", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
})
const product = created.product
for (const variant of product.variants || []) {
  const mensSize = String(variant.metadata?.mens_us)
  const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
  if (!itemId) throw new Error(`${variant.id}: inventory item missing`)
  await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ location_id: IDS.location, stocked_quantity: STOCK[mensSize] || 0 }),
  })
}

const report = {
  created_at: new Date().toISOString(), product_id: product.id, title: product.title, handle: product.handle,
  status: product.status, price_nzd: PRICE, image_count: product.images?.length, image_urls: product.images?.map((image) => image.url),
  variant_count: product.variants?.length, variants: product.variants?.map((v) => ({ id: v.id, title: v.title, sku: v.sku, mens_us: v.metadata?.mens_us, stocked_quantity: STOCK[String(v.metadata?.mens_us)] || 0 })),
  tags: product.tags?.map((tag) => tag.value), category: product.categories?.map((category) => category.name), collection: product.collection?.title,
  type: product.type?.value, metadata: product.metadata, files,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${product.id}: ${product.title}`)
console.log(`Report: ${REPORT_PATH}`)
