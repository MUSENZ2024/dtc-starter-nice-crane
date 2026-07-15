import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/birkenstock-boston-taupe-nz-stock-report.json"

const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/IMG_4807.webp",
  "/Users/mrburns_mac/Downloads/IMG_4812.webp",
  "/Users/mrburns_mac/Downloads/IMG_4818.webp",
  "/Users/mrburns_mac/Downloads/IMG_4814.webp",
  "/Users/mrburns_mac/Downloads/IMG_4817.webp",
  "/Users/mrburns_mac/Downloads/IMG_4811.webp",
  "/Users/mrburns_mac/Downloads/IMG_4815.webp",
  "/Users/mrburns_mac/Downloads/IMG_4813.webp",
]

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  category: "pcat_01KT3HVWSHGSW3S0CW47QYQS4E",
  brandTag: "ptag_01KT3WCMJA8D5AQKX88W0QZSDB",
  modelTag: "ptag_01KT3WNHPXD0D6VEJSJSCAEJQF",
  beigeTag: "ptag_01KTK0T26069JENXQ0DCZ911CN",
  greyTag: "ptag_01KTK0SY4FX25YG2EGSCF492ZT",
}

const TITLE = "Birkenstock Boston Soft Footbed Suede - Taupe"
const HANDLE = "birkenstock-boston-soft-footbed-suede-taupe-nz-stock"
const EXTERNAL_ID = "NZSTOCK-BIRKENSTOCK-BOSTON-SOFT-FOOTBED-SUEDE-TAUPE"
const PRICE = 150
const SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"]
const STOCK_BY_SIZE = {
  "36": 1,
  "38": 1,
  "40": 3,
  "43": 1,
  "45": 1,
}

const DESCRIPTION = `The Birkenstock Boston Soft Footbed Suede Taupe is the classic year-round clog in Birkenstock's most wearable neutral colourway.

The taupe suede upper gives the Boston its relaxed texture, while the adjustable strap and metal pin buckle let you fine-tune the fit across the instep.

Underfoot, the soft footbed adds an integrated foam layer above Birkenstock's contoured cork-latex base, giving the clog a cushioned feel that still shapes naturally with wear.

The lightweight EVA outsole keeps the Boston easy for everyday use, with the signature cork sidewall and rounded closed toe making it one of Birkenstock's most recognisable silhouettes.

This pair is NZ Stock, held locally in limited sizes and ready for faster Auckland dispatch.`

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
  for (let offset = 0; offset < 1000; offset += 100) {
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
  form.append("files", new File([data], path.basename(filePath), { type: "image/webp" }))
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
  (product) =>
    product.handle === HANDLE ||
    product.external_id === EXTERNAL_ID ||
    /birkenstock.*boston.*taupe|boston.*taupe/i.test([product.title, product.handle, product.external_id].join(" "))
)

if (existing) {
  console.log(`Skipped existing product: ${existing.id} ${existing.title}`)
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

const taupeTag = await ensureTag("colour:taupe")
const tagIds = [IDS.brandTag, IDS.modelTag, taupeTag.id, IDS.beigeTag, IDS.greyTag]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} with ${SIZES.length} adult EU sizes and ${Object.values(STOCK_BY_SIZE).reduce((sum, qty) => sum + qty, 0)} total NZ-stock pairs.`)

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
  weight: 900,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZES }],
  variants: SIZES.map((size) => ({
    title: size,
    sku: `MUSE-NZ-BIRK-BOSTON-TAUPE-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
    brand: "Birkenstock",
    model: "Birkenstock Boston",
    product_code: "0560771",
    colourway: "Taupe",
    material: "Suede leather",
    fit: "true to size",
    fit_true_to_size_percent: "92",
    fit_sized_up_percent: "8",
    colour_tags: "colour:taupe | colour:beige | colour:grey",
    colour_confidence: "verified",
    colour_source: "StockX / Birkenstock official",
    size_chart: "birkenstock-adult",
    image_source: "local customer photos",
    rrp_nzd: "280",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,thumbnail,*images,*variants,*variants.inventory_items,*tags,metadata", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
})

const report = {
  created_at: new Date().toISOString(),
  product_id: created.product?.id,
  title: created.product?.title,
  handle: created.product?.handle,
  external_id: created.product?.external_id,
  image_count: created.product?.images?.length,
  variant_count: created.product?.variants?.length,
  variants: created.product?.variants?.map((variant) => ({
    id: variant.id,
    title: variant.title,
    sku: variant.sku,
    manage_inventory: variant.manage_inventory,
    allow_backorder: variant.allow_backorder,
    inventory_quantity: variant.inventory_quantity,
  })),
  tags: created.product?.tags?.map((tag) => tag.value),
  files,
}

await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${created.product?.id}: ${created.product?.title}`)
console.log(`Report: ${REPORT_PATH}`)
