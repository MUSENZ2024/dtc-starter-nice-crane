import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/coach-lana-shoulder-bag-black-nz-stock-report.json"
const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/IMG_7344.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7347.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7339.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7342.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7343.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7334.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7335.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7341.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7338.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7337.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7333.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7345.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7336.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7340.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_7346 (1).jpeg",
]
const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  location: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  blackTag: "ptag_01KTK0SR51P97PKDFT8C71GB7C",
}
const TITLE = "Coach Lana Shoulder Bag - Black"
const HANDLE = "coach-lana-shoulder-bag-black-nz-stock"
const EXTERNAL_ID = "NZSTOCK-COACH-LANA-CM544-BLACK"
const DIMENSIONS = "33.5cm(L) * 26cm(H) * 19.5cm(W)"
const PRICE = 150
const DESCRIPTION = `A spacious everyday shoulder bag in black polished pebble leather, finished with brass-tone Coach hardware. The structured interior has a secure central zipped compartment, two open sections and an inside slip pocket to keep daily essentials organised.

Carry it by the wide shoulder handles or use the detachable strap. Protective feet help keep the base raised when the bag is set down.

Dimensions: ${DIMENSIONS}.`

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
  const found = (body.product_tags || body.tags || []).find((tag) => tag.value === value)
  if (found) return found
  if (dryRun) return { id: `dry-${value}`, value }
  const created = await adminFetch("/admin/product-tags", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }),
  })
  return created.product_tag || created.tag
}

const ensureCategory = async () => {
  const body = await adminFetch("/admin/product-categories?limit=200&fields=id,name,handle")
  const found = (body.product_categories || []).find((category) => category.handle === "bags")
  if (found) return found
  if (dryRun) return { id: "dry-bags", name: "Bags", handle: "bags" }
  const created = await adminFetch("/admin/product-categories", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Bags", handle: "bags", is_active: true, is_internal: false }),
  })
  return created.product_category
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

const [category, coachTag, lanaTag, bagsTag, shoulderBagTag] = await Promise.all([
  ensureCategory(), ensureTag("coach"), ensureTag("coach-lana"), ensureTag("bags"), ensureTag("shoulder-bag"),
])
console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`${TITLE}; one dimension option; stock 1; ${IMAGE_PATHS.length} ordered photos; NZ$${PRICE}.`)
if (dryRun) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({ dry_run: true, title: TITLE, handle: HANDLE, price_nzd: PRICE, dimensions: DIMENSIONS, stock: 1, image_paths: IMAGE_PATHS, category, tags: [coachTag, lanaTag, bagsTag, shoulderBagTag] }, null, 2))
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
  thumbnail: urls[0],
  images: urls.map((url) => ({ url })),
  options: [{ title: "Size", values: [DIMENSIONS] }],
  variants: [{
    title: DIMENSIONS,
    sku: "MUSE-NZ-COACH-LANA-CM544-BLACK",
    allow_backorder: false,
    manage_inventory: true,
    options: { Size: DIMENSIONS },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
    metadata: { display_size: DIMENSIONS, dimensions: DIMENSIONS, nz_stock_quantity: "1", availability_note: "NZ stock - single unit" },
  }],
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  type_id: IDS.productType,
  categories: [{ id: category.id }],
  tags: [coachTag.id, lanaTag.id, bagsTag.id, shoulderBagTag.id, IDS.blackTag].map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock",
    stock_source: "nz_stock",
    brand: "Coach",
    model: "Lana Shoulder Bag",
    style_number: "CM544",
    product_kind: "bag",
    bag_type: "shoulder bag",
    colourway: "Black",
    full_colourway: "Brass/Black",
    colour_tags: "colour:black",
    material: "Polished pebble leather",
    dimensions: DIMENSIONS,
    length_cm: "33.5",
    height_cm: "26",
    width_cm: "19.5",
    size_chart_disabled: "true",
    condition: "New",
    image_source: "user-supplied product photos",
    product_information_source: "Coach official product page",
    official_product_url: "https://de.coach.com/products/lana-schultertasche/CM544%20B4YTH.html",
    price_nzd: String(PRICE),
    seo_title: "Coach Lana Shoulder Bag - Black | NZ Stock | MUSE",
    meta_description: "Shop the Coach Lana Shoulder Bag in Black for NZ$150. Spacious polished pebble leather design with three organised compartments. NZ Stock in Auckland.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*tags,*categories,*collection,*type,metadata", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
})
const product = created.product
const variant = product.variants?.[0]
const itemId = variant?.inventory_items?.[0]?.inventory_item_id || variant?.inventory_items?.[0]?.id
if (!itemId) throw new Error(`${variant?.id}: inventory item missing`)
await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ location_id: IDS.location, stocked_quantity: 1 }),
})

const report = {
  created_at: new Date().toISOString(), product_id: product.id, title: product.title, handle: product.handle,
  status: product.status, price_nzd: PRICE, image_count: product.images?.length, image_urls: product.images?.map((image) => image.url),
  variant_count: product.variants?.length, variant: { id: variant.id, title: variant.title, sku: variant.sku, stocked_quantity: 1 },
  tags: product.tags?.map((tag) => tag.value), category: product.categories?.map((item) => item.name), collection: product.collection?.title,
  type: product.type?.value, metadata: product.metadata, files,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${product.id}: ${product.title}`)
console.log(`Report: ${REPORT_PATH}`)
