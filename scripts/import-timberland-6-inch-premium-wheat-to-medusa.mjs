import fs from "node:fs/promises"
import path from "node:path"

// No images are read, downloaded, uploaded, or attached by this import.
const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const EXPORT_PATH = "/Users/mrburns_mac/Downloads/products_Jun-21_11-40-55PM.csv"
const OUT_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/timberland-6-inch-premium-wheat"
const REVIEW_PATH = path.join(OUT_DIR, "timberland-6-inch-premium-wheat-review.csv")
const REPORT_PATH = path.join(OUT_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")

const TITLE = 'Timberland 6" Premium Waterproof Boot - Wheat'
const HANDLE = "timberland-6-inch-premium-waterproof-boot-wheat"
const EXTERNAL_ID = "SQUARESPACE-TIMBERLAND-10061-713"
const PRODUCT_CODE = "10061-713"
const PRICE = 170
const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}
const COLOUR_SOURCE = "https://stockx.com/timberland-6-inch-premium-waterproof-boots-wheat-wide"
const PRODUCT_SOURCE = "https://www.timberland.co.nz/products/mens-6-inch-premium-waterproof-boot-wheat"

const csvLine = (line) => {
  const cells = []
  let value = "", quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === "," && !quoted) { cells.push(value); value = "" }
    else value += char
  }
  cells.push(value)
  return cells
}
const csvEscape = (value) => /[",\n]/.test(String(value ?? "")) ? `"${String(value ?? "").replaceAll('"', '""')}"` : String(value ?? "")

const raw = await fs.readFile(EXPORT_PATH, "utf8")
const [headerLine, ...lines] = raw.trim().split(/\r?\n/)
const headers = csvLine(headerLine)
const rows = lines.map((line) => Object.fromEntries(headers.map((header, index) => [header, csvLine(line)[index] || ""])))
const timberlandRows = rows.filter((row) => row["Product URL"] === HANDLE || row["Variant ID [Non Editable]"])
const sourceRows = timberlandRows.filter((row) => row["Product URL"] === HANDLE || row["Option Value 1"])
const rawSizes = sourceRows.map((row) => row["Option Value 1"]).filter(Boolean)
const displaySizes = rawSizes.map((size) => size.replace(/^US\s+/g, "").replace(/\s+\/\s+US\s+/g, " / "))
if (rawSizes.length !== 11 || new Set(displaySizes).size !== 11) throw new Error(`Expected 11 unique source sizes; found ${rawSizes.length}.`)

const description = `The Timberland 6-inch Premium Waterproof Boot is the original rugged boot in the Wheat colourway.

It is made with premium waterproof leather and seam-sealed construction for wet-weather protection, plus Timberland's anti-fatigue comfort technology for everyday wear.

Sizes are shown as US Men's / US Women's.`
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
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body
}
const listAll = async (endpoint, key) => {
  const all = []
  for (let offset = 0; offset < 5000; offset += 100) {
    const body = await adminFetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}limit=100&offset=${offset}`)
    const page = body[key] || []
    all.push(...page)
    if (page.length < 100) break
  }
  return all
}
const ensureTag = async (tags, value) => {
  const present = tags.get(value)
  if (present) return present
  if (dryRun) return { id: `dry-${value}`, value }
  const created = await adminFetch("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) })
  const tag = created.product_tag || created.tag
  tags.set(value, tag)
  return tag
}

await fs.mkdir(OUT_DIR, { recursive: true })
const products = await listAll("/admin/products?fields=id,title,handle,external_id,metadata", "products")
const duplicate = products.find((product) =>
  [product.handle, product.external_id, product.metadata?.product_code, product.title].some((value) => String(value || "").toLowerCase() === HANDLE || String(value || "").toLowerCase() === EXTERNAL_ID.toLowerCase() || String(value || "").replace(/[.\s]/g, "").toLowerCase() === PRODUCT_CODE.replace(/[.\s-]/g, "").toLowerCase())
)
const reviewHeader = ["product_code", "product_name", "colourway", "colour_tags", "colour_source", "colour_confidence", "source_sizes", "display_sizes", "image_count", "import_status", "notes"]

if (duplicate) {
  const report = { finished_at: new Date().toISOString(), skipped: true, status: "skipped_existing", existing_product: duplicate, image_policy: "No image scrape or image import requested." }
  await fs.writeFile(REVIEW_PATH, [reviewHeader, [PRODUCT_CODE, TITLE, "Wheat", "colour:wheat | colour:brown", COLOUR_SOURCE, "verified", rawSizes.join(" | "), displaySizes.join(" | "), "0", "skipped_existing", "Existing Medusa product matched by handle, external ID, code, or title."]].map((row) => row.map(csvEscape).join(",")).join("\n"))
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Skipped existing product: ${duplicate.id} ${duplicate.title}`)
  process.exit(0)
}

const tags = new Map((await listAll("/admin/product-tags", "product_tags")).map((tag) => [tag.value, tag]))
const tagValues = ["timberland", "timberland-6-inch-premium-waterproof-boot", "colour:wheat", "colour:brown"]
const productTags = []
for (const value of tagValues) productTags.push(await ensureTag(tags, value))
const payload = {
  title: TITLE,
  subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
  handle: HANDLE,
  description,
  status: "published",
  discountable: true,
  weight: 900,
  external_id: EXTERNAL_ID,
  options: [{ title: "Size", values: displaySizes }],
  variants: displaySizes.map((size, index) => ({
    title: size,
    sku: `MUSE-TIMBERLAND-10061713-${rawSizes[index].replace(/[^A-Z0-9]/gi, "")}`.toUpperCase(),
    allow_backorder: true,
    manage_inventory: false,
    weight: 900,
    options: { Size: size },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
    metadata: { source_size: rawSizes[index], display_size: size, size_system: "us-mens-us-womens" },
  })),
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  categories: [{ id: IDS.category }],
  type_id: IDS.productType,
  tags: productTags.map((tag) => ({ id: tag.id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "squarespace_export",
    source_export: EXPORT_PATH,
    source_handle: HANDLE,
    product_code: PRODUCT_CODE,
    brand: "Timberland",
    model: 'Timberland 6" Premium Waterproof Boot',
    colourway: "Wheat",
    colour_tags: "colour:wheat | colour:brown",
    colour_confidence: "verified",
    colour_source: COLOUR_SOURCE,
    product_information_source: PRODUCT_SOURCE,
    source_size_system: "US Men's / US Women's",
    display_size_system: "US Men's / US Women's",
    size_display_note: "Sizes are shown as US Men's / US Women's.",
    image_count: "0",
    image_source_policy: "No photo scrape or image import requested.",
  },
}

let result
if (dryRun) result = { dry_run: true, title: TITLE, handle: HANDLE, image_count: 0, variant_count: payload.variants.length, display_sizes: displaySizes, price: PRICE, tags: tagValues }
else {
  const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,thumbnail,*images,*variants,*tags,metadata", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
  result = { product_id: created.product?.id, title: created.product?.title, handle: created.product?.handle, image_count: created.product?.images?.length || 0, variant_count: created.product?.variants?.length, display_sizes: created.product?.variants?.map((variant) => variant.title), prices: created.product?.variants?.map((variant) => variant.prices), tags: created.product?.tags?.map((tag) => tag.value) }
}
await fs.writeFile(REVIEW_PATH, [reviewHeader, [PRODUCT_CODE, TITLE, "Wheat", "colour:wheat | colour:brown", COLOUR_SOURCE, "verified", rawSizes.join(" | "), displaySizes.join(" | "), "0", dryRun ? "dry_run_create" : "created", "No image scrape or image import requested."]].map((row) => row.map(csvEscape).join(",")).join("\n"))
await fs.writeFile(REPORT_PATH, JSON.stringify({ started_at: new Date().toISOString(), ...result, image_policy: "No image scrape or image import requested." }, null, 2))
console.log(`${dryRun ? "Would create" : "Created"}: ${TITLE} (${displaySizes.length} variants, $${PRICE}, 0 images)`)
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
