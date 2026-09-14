import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/coach-teri-mini-crossbody-signature-canvas-nz-stock-report.json"
const IMAGES = ["IMG_9544.jpeg", "IMG_9546.jpeg", "IMG_9547.jpeg", "IMG_9548.jpeg", "IMG_9549.jpeg", "IMG_9550.jpeg", "IMG_9551.jpeg", "IMG_9552.jpeg", "IMG_9553.jpeg", "IMG_9554.jpeg", "IMG_9555.jpeg", "IMG_9556.jpeg", "IMG_9557.jpeg"].map((name) => `/Users/mrburns_mac/Downloads/${name}`)
const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  location: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  blackTag: "ptag_01KTK0SR51P97PKDFT8C71GB7C",
}
const TITLE = "Coach Teri Shoulder Bag - Signature Canvas"
const HANDLE = "coach-teri-shoulder-bag-signature-canvas-nz-stock"
const EXTERNAL_ID = "NZSTOCK-COACH-TERI-CW323-SIGNATURE-CANVAS"
const SIZE = "19.7cm(L) * 12.7cm(H) * 5.7cm(W)"
const PRICE = 170
const DESCRIPTION = `A compact everyday bag in Coach Signature coated canvas with black trim and gold-tone hardware. The zipped interior includes a snap pocket and two card slots for small essentials.

Switch between the detachable 22.2cm short strap and 57.2cm long strap for shoulder or crossbody wear.

Dimensions: ${SIZE}.`
const OFFICIAL_URL = "https://www.coach.com/products/teri-mini-crossbody-bag-in-signature-canvas/CW323.html"
const dryRun = process.argv.includes("--dry-run")

const env = await fs.readFile(path.resolve(".image-upload.env"), "utf8")
const key = env.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!key?.startsWith("sk_")) throw new Error("Missing MEDUSA_ADMIN_API_KEY")
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
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value }),
  })
  return created.product_tag || created.tag
}

const ensureCategory = async () => {
  const body = await adminFetch("/admin/product-categories?limit=200&fields=id,name,handle")
  const found = (body.product_categories || []).find((category) => category.handle === "bags")
  if (found) return found
  if (dryRun) return { id: "dry-bags", name: "Bags", handle: "bags" }
  const created = await adminFetch("/admin/product-categories", {
    method: "POST",
    headers: { "content-type": "application/json" },
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

for (const imagePath of IMAGES) await fs.access(imagePath)
const existing = (await listProducts()).find((product) => product.handle === HANDLE || product.external_id === EXTERNAL_ID)
if (existing) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  console.log(`Skipped existing product: ${existing.id}`)
  process.exit(0)
}

const [category, coachTag, teriTag, bagsTag, crossbodyTag, signatureCanvasTag] = await Promise.all([
  ensureCategory(), ensureTag("coach"), ensureTag("coach-teri"), ensureTag("bags"), ensureTag("crossbody-bag"), ensureTag("signature-canvas"),
])
console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`${TITLE}; ${SIZE}; stock 1; ${IMAGES.length} ordered photos; NZ$${PRICE}.`)
if (dryRun) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({ dry_run: true, title: TITLE, handle: HANDLE, price_nzd: PRICE, size: SIZE, stock: 1, image_paths: IMAGES, category, tags: [coachTag, teriTag, bagsTag, crossbodyTag, signatureCanvasTag] }, null, 2))
  process.exit(0)
}

const files = []
for (const imagePath of IMAGES) files.push({ local_path: imagePath, ...(await upload(imagePath)) })
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
  options: [{ title: "Size", values: [SIZE] }],
  variants: [{
    title: SIZE,
    sku: "MUSE-NZ-COACH-TERI-CW323-SIGNATURE",
    allow_backorder: false,
    manage_inventory: true,
    options: { Size: SIZE },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
    metadata: { display_size: SIZE, dimensions: SIZE, nz_stock_quantity: "1", availability_note: "NZ stock - single unit" },
  }],
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  type_id: IDS.productType,
  categories: [{ id: category.id }],
  tags: [coachTag.id, teriTag.id, bagsTag.id, crossbodyTag.id, signatureCanvasTag.id, IDS.blackTag].map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock",
    stock_source: "nz_stock",
    brand: "Coach",
    model: "Teri Shoulder Bag",
    style_number: "CW323",
    product_kind: "bag",
    bag_type: "shoulder and crossbody bag",
    colourway: "Signature Canvas",
    full_colourway: "Gold/Walnut/Black",
    colour_tags: "colour:black",
    material: "Signature coated canvas",
    lining: "Recycled polyester",
    dimensions: SIZE,
    length_cm: "19.7",
    height_cm: "12.7",
    width_cm: "5.7",
    short_strap_drop_cm: "22.2",
    long_strap_drop_cm: "57.2",
    size_chart_disabled: "true",
    condition: "New",
    image_source: "user-supplied product photos",
    product_information_source: "Coach official product page",
    official_product_url: OFFICIAL_URL,
    price_nzd: String(PRICE),
    seo_title: "Coach Teri Shoulder Bag - Signature Canvas | NZ Stock | MUSE",
    meta_description: "Shop the Coach Teri Shoulder Bag in Signature Canvas for NZ$170. Two detachable straps for shoulder or crossbody wear. NZ Stock in Auckland.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*tags,*categories,*collection,*type,metadata", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
})
const product = created.product
const variant = product.variants?.[0]
const itemId = variant?.inventory_items?.[0]?.inventory_item_id || variant?.inventory_items?.[0]?.id
if (!itemId) throw new Error(`${variant?.id}: inventory item missing`)
await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
  method: "POST",
  headers: { "content-type": "application/json" },
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
