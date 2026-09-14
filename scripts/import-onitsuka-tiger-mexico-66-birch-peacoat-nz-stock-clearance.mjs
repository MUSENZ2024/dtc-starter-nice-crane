import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/onitsuka-tiger-mexico-66-birch-peacoat-dl408-1659-nz-stock-clearance-report.json"
const IMAGE_PATHS = [
  "IMG_0208.jpeg", "IMG_0209.jpeg", "IMG_0210.jpeg", "IMG_0211.jpeg",
  "IMG_0212.jpeg", "IMG_0213.jpeg", "IMG_0214.jpeg", "IMG_0215.jpeg",
  "IMG_0216.jpeg", "IMG_0217.jpeg", "IMG_0219.jpeg", "IMG_0218.jpeg",
  "IMG_0220.jpeg", "IMG_0221.jpeg",
].map((name) => `/Users/mrburns_mac/Downloads/${name}`)

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WBGRY1SAJZC635R9S9S4E",
  modelTag: "ptag_01KT3WHSJ1C065C3GZ58K0RGJ0",
  saleTag: "ptag_01KT3W19BT07ANEQBF425WT73N",
}

const TITLE = "Onitsuka Tiger Mexico 66 - Birch Peacoat"
const HANDLE = "onitsuka-tiger-mexico-66-birch-peacoat-dl408-1659-nz-stock-clearance"
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-ONITSUKA-TIGER-MEXICO-66-DL408-1659-SIZE-39-MISSING-INSOLE"
const STYLE_CODE = "DL408-1659"
const STANDARD_PRODUCT_ID = "prod_01KTJFV8ECAK749SNH1D9811ME"
const PRICE = 80
const SIZE_ROWS = [
  ["4", "5.5", "36", "22.5", "3"], ["5", "6.5", "37.5", "23.5", "4"],
  ["5.5", "7", "38", "24", "4.5"], ["6", "7.5", "39", "24.5", "5"],
  ["6.5", "8", "39.5", "25", "5.5"], ["7", "8.5", "40", "25.5", "6"],
  ["7.5", "9", "40.5", "25.75", "6.5"], ["8", "9.5", "41.5", "26", "7"],
  ["8.5", "10", "42", "26.5", "7.5"], ["9", "10.5", "42.5", "27", "8"],
  ["9.5", "11", "43.5", "27.5", "8.5"], ["10", "11.5", "44", "28", "9"],
  ["10.5", "12", "44.5", "28.25", "9.5"], ["11", "12.5", "45", "28.5", "10"],
  ["11.5", "13", "46", "29", "10.5"], ["12", "13.5", "46.5", "29.5", "11"],
  ["12.5", "14", "47", "30", "11.5"], ["13", "14.5", "48", "30.5", "12"],
  ["13.5", "15", "48.5", "30.75", "12.5"], ["14", "15.5", "49", "31", "13"],
  ["15", "16.5", "50.5", "32", "14"], ["16", "17.5", "51.5", "33", "15"],
]
const SIZES = SIZE_ROWS.map((row) => row[2])
const STOCK_BY_SIZE = { "39": 1 }

const DESCRIPTION = `The Onitsuka Tiger Mexico 66 Birch Peacoat brings the model's slim 1960s running profile into a distinctive birch and peacoat colourway.

The low-profile upper keeps the shoe light and easy to style, while the signature Onitsuka Tiger side stripes give it the heritage look the Mexico 66 is known for.

This Birch Peacoat edition is built around clean contrast rather than bulk, making it an easy everyday sneaker with a vintage shape.

Clearance condition: this unworn pair is in good condition overall but is missing one insole, as clearly shown in the product photos. The included insole remains in the other shoe.

This pair is NZ Stock in EU39 and is priced as Clearance. This is final sale clearance stock - no refunds or exchanges.`

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }
const dryRun = process.argv.includes("--dry-run")

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
  return body
}

const listProducts = async () => {
  const products = []
  for (let offset = 0; offset < 4000; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) break
  }
  return products
}

const ensureTag = async (value) => {
  const body = await adminFetch(`/admin/product-tags?limit=300`)
  const match = (body.product_tags || body.tags || []).find((tag) => tag.value === value)
  if (match) return match.id
  if (dryRun) return `would-create:${value}`
  const created = await adminFetch("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) })
  return (created.product_tag || created.tag).id
}

const uploadFile = async (filePath) => {
  const data = await fs.readFile(filePath)
  const form = new FormData()
  form.append("files", new File([data], path.basename(filePath), { type: "image/jpeg" }))
  const response = await fetch(`${BACKEND_URL}/admin/uploads`, { method: "POST", headers: authHeaders, body: form })
  const body = await response.json()
  if (!response.ok) throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body.files[0]
}

for (const imagePath of IMAGE_PATHS) await fs.access(imagePath)
const existing = (await listProducts()).find((product) => product.handle === HANDLE || product.external_id === EXTERNAL_ID)
if (existing) {
  console.log(`Skipped existing product: ${existing.id} ${existing.title}`)
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

const extraTagValues = ["clearance", "colour:beige", "colour:navy"]
const extraTagIds = []
for (const value of extraTagValues) extraTagIds.push(await ensureTag(value))
const tagIds = [IDS.brandTag, IDS.modelTag, IDS.saleTag, ...extraTagIds]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Product: ${TITLE}; 14 ordered photos; 22 EU variants; only EU39 stocked; NZ$${PRICE}; final sale.`)
if (dryRun) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({ dry_run: true, title: TITLE, handle: HANDLE, style_code: STYLE_CODE, image_paths: IMAGE_PATHS, sizes: SIZES, stock_by_size: STOCK_BY_SIZE, tag_ids: tagIds }, null, 2))
  process.exit(0)
}

const files = []
for (const filePath of IMAGE_PATHS) files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
const imageUrls = files.map((file) => file.url)
const payload = {
  title: TITLE,
  subtitle: "NZ Stock Clearance - EU39 - Missing One Insole - Final Sale",
  handle: HANDLE,
  description: DESCRIPTION,
  status: "published",
  discountable: false,
  weight: 350,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZES }],
  variants: SIZE_ROWS.map(([mens, womens, eu, cm, uk]) => ({
    title: eu,
    sku: `MUSE-NZ-OT-M66-DL4081659-CLR-EU${eu}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: false,
    manage_inventory: true,
    weight: 350,
    options: { Size: eu },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
    metadata: {
      mens_us_size: mens, womens_us_size: womens, eu_size: eu, cm_size: cm, uk_size: uk,
      display_size: eu, size_system: "asics-eu", source_size_system: "eu",
      nz_stock_quantity: String(STOCK_BY_SIZE[eu] || 0),
      availability_note: STOCK_BY_SIZE[eu] ? "NZ stock - clearance" : "Out of stock",
    },
  })),
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  categories: [{ id: IDS.category }],
  type_id: IDS.productType,
  tags: tagIds.map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock", stock_source: "nz_stock", standard_product_id: STANDARD_PRODUCT_ID,
    brand: "Onitsuka Tiger", parent_brand: "ASICS", model: "Mexico 66",
    product_code: STYLE_CODE, style_code: STYLE_CODE, visible_label_code: "DL408",
    colourway: "Birch Peacoat", full_colourway: "Birch / Peacoat",
    colour_tags: "colour:beige | colour:navy", colour_confidence: "verified",
    size_chart: "asics-adult", condition: "unworn",
    condition_note: "Missing one insole; all other aspects are in good condition",
    clearance_reason: "Missing one insole", image_source: "user-supplied product photos",
    is_clearance: "true", return_policy: "final_sale_no_refunds", clearance_price_nzd: String(PRICE),
    seo_title: "Onitsuka Tiger Mexico 66 Birch Peacoat | EU39 Clearance | MUSE",
    meta_description: "Onitsuka Tiger Mexico 66 Birch Peacoat (DL408-1659), NZ Stock EU39. Unworn clearance pair missing one insole. NZ$80 final sale; no refunds or exchanges.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*tags,metadata", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
})
const product = created.product
for (const variant of product.variants || []) {
  const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
  if (!itemId) throw new Error(`${product.id}/${variant.id}: inventory item was not created`)
  await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ location_id: IDS.aucklandLocation, stocked_quantity: STOCK_BY_SIZE[String(variant.title)] || 0 }),
  })
}

const report = {
  created_at: new Date().toISOString(), product_id: product.id, title: product.title, handle: product.handle,
  external_id: product.external_id, status: product.status, image_count: product.images?.length,
  variant_count: product.variants?.length, stocked_sizes: STOCK_BY_SIZE,
  variants: product.variants?.map((variant) => ({ id: variant.id, title: variant.title, sku: variant.sku, stocked_quantity: STOCK_BY_SIZE[variant.title] || 0 })),
  tags: product.tags?.map((tag) => tag.value), files,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${product.id}: ${product.title} [${product.status}]`)
console.log(`Report: ${REPORT_PATH}`)
