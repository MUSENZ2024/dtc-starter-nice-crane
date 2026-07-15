import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const EXPORT_PATH = "/Users/mrburns_mac/Downloads/products_Jun-21_10-25-31PM.csv"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/squarespace-dr-martens"
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const REVIEW_PATH = path.join(BASE_DIR, "dr-martens-enriched-review.csv")
const ENV_PATH = path.resolve(".image-upload.env")
const dryRun = process.argv.includes("--dry-run")
const onlyHandle = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length)

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const ALL_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
const MARY_JANE_SIZES = ALL_SIZES.slice(0, 8)

// Product facts are independently verified against the listed StockX or official Dr. Martens page.
// Images deliberately come only from the user-supplied Squarespace export.
const PRODUCTS = [
  { sourceHandle: "dr-marten-cherry-red", code: "10072600/11822600", title: "Dr. Martens 1460 Smooth Leather Boots - Cherry Red", colourway: "Cherry Red", colours: ["red"], model: "1460 Smooth Leather Boots", price: 120, source: "https://stockx.com/dr-martens-1460-cherry-smooth-leather", confidence: "verified", details: "Eight-eye 1460 boot in cherry-red Smooth leather with an air-cushioned sole and signature yellow welt stitch." },
  { sourceHandle: "dr-martens-myles-sandles", code: "23523001", title: "Dr. Martens Myles Leather Buckle Slide Sandals - Black", colourway: "Black", colours: ["black"], model: "Myles Leather Buckle Slide Sandals", price: 150, source: "https://www.goat.com/sneakers/myles-brando-leather-buckle-slide-sandal-black-23523001", confidence: "verified", details: "Leather slide sandal with two adjustable buckle straps and a lightweight ripple sole." },
  { sourceHandle: "dr-martens-blaire-hydro", code: "24235001", title: "Dr. Martens Blaire Hydro Leather Strap Sandals - Black", colourway: "Black", colours: ["black"], model: "Blaire Hydro Leather Strap Sandals", price: 150, source: "https://www.drmartens.com/intl/en/blaire-womens-hydro-leather-gladiator-sandals-black/p/24235001", confidence: "verified", details: "Black Hydro leather strap sandal with an adjustable ankle buckle, SoftWair footbed and lightweight EVA platform sole." },
  { sourceHandle: "dr-martens-boot-1460-platform", code: "15265001", title: "Dr. Martens Jadon Smooth Leather Platform Boots - Black", colourway: "Black Polished Smooth", colours: ["black"], model: "Jadon Smooth Leather Platform Boots", price: 150, source: "https://www.drmartens.com/uk/en_gb/jadon-smooth-leather-platform-boots-black/p/15265001", confidence: "verified", details: "Eight-eye platform boot in polished Smooth leather with an inside zip, grooved Quad sole and yellow welt stitching." },
  { sourceHandle: "dr-martens-low-1461-platform", code: "25567001", title: "Dr. Martens 1461 Smooth Leather Platform Shoes - Black", colourway: "Black", colours: ["black"], model: "1461 Smooth Leather Platform Shoes", price: 160, source: "https://www.drmartens.com/ca/en_ca/1461-smooth-leather-platform-shoes-noir/p/25567001", confidence: "verified", details: "Three-eye 1461 platform shoe in black Smooth leather, built on the elevated Quad sole." },
  { sourceHandle: "dr-martens-adrian-smooth-leather-tassel-loafer-black", code: "22209001", title: "Dr. Martens Adrian Smooth Leather Tassel Loafers - Black", colourway: "Black", colours: ["black"], model: "Adrian Smooth Leather Tassel Loafers", price: 150, source: "https://stockx.com/dr-martens-adrian-smooth-leather-tassel-loafer-black", confidence: "verified", details: "Black Smooth leather loafer with tassel and kiltie fringe detailing, yellow welt stitching and an air-cushioned sole." },
  { sourceHandle: "dr-martens-8065-mary-jane-smooth-black", code: "12916001", title: "Dr. Martens 8065 Smooth Leather Mary Jane Shoes - Black", colourway: "Black", colours: ["black"], model: "8065 Smooth Leather Mary Jane Shoes", price: 160, source: "https://www.drmartens.com/us/en/p/originals-shoes-smooth-8065-mary-jane", confidence: "verified", details: "Double-strap Mary Jane in black Smooth leather with adjustable horseshoe buckles, brogue detailing and yellow welt stitching.", sizes: MARY_JANE_SIZES },
]

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const parseCsv = (text) => {
  const rows = []
  let row = [], field = "", quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted && char === '"' && text[i + 1] === '"') { field += char; i += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (!quoted && char === ",") { row.push(field); field = ""; continue }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1
      row.push(field); rows.push(row); row = []; field = ""; continue
    }
    field += char
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [headers, ...data] = rows
  return data.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}

const slugify = (value) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const descriptionFor = (product) => [
  `${product.title.replace("Dr. Martens ", "")} brings a classic Dr. Martens silhouette into a ${product.colourway.toLowerCase()} finish.`,
  product.details,
  "Made for everyday rotation, it pairs distinctive Dr. Martens construction with an easy-to-style profile.",
].join("\n\n")

await fs.mkdir(BASE_DIR, { recursive: true })
const exportRows = parseCsv(await fs.readFile(EXPORT_PATH, "utf8"))
const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

const adminFetch = async (url, options = {}) => {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(`${BACKEND_URL}${url}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } })
    const text = await response.text()
    let body
    try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
    if (response.ok) return body
    const transient = response.status >= 500 && /connection refused|dial tcp/i.test(text)
    if (!transient || attempt === 4) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
    console.warn(`Transient Admin API ${response.status}; retrying ${url} (${attempt}/4)`)
    await new Promise((resolve) => setTimeout(resolve, attempt * 2500))
  }
}

const listProducts = async () => {
  const products = []
  for (let offset = 0; ; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,metadata`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) return products
  }
}

const listTags = async () => {
  const tags = []
  for (let offset = 0; ; offset += 100) {
    const body = await adminFetch(`/admin/product-tags?limit=100&offset=${offset}`)
    const page = body.product_tags || body.tags || []
    tags.push(...page)
    if (page.length < 100) return tags
  }
}

const uploadSquarespaceImage = async (url, index) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Squarespace image download failed ${response.status}: ${url}`)
  const bytes = await response.arrayBuffer()
  const contentType = response.headers.get("content-type") || "image/jpeg"
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const form = new FormData()
    form.append("files", new File([bytes], `squarespace-${index + 1}.${extension}`, { type: contentType }))
    try {
      const upload = await fetch(`${BACKEND_URL}/admin/uploads`, { method: "POST", headers: authHeaders, body: form })
      const text = await upload.text()
      let body
      try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
      if (upload.ok && body.files?.[0]?.url) return body.files[0].url
      if (attempt === 4) throw new Error(`Medusa upload failed ${upload.status}: ${JSON.stringify(body).slice(0, 1000)}`)
    } catch (error) {
      if (attempt === 4) throw error
    }
    console.warn(`Transient image upload error; retrying image ${index + 1} (${attempt}/4)`)
    await new Promise((resolve) => setTimeout(resolve, attempt * 2500))
  }
}

const existingProducts = await listProducts()
const existingTokens = new Set(existingProducts.flatMap((product) => [product.handle, product.external_id, product.metadata?.product_code, product.title].filter(Boolean).map((value) => String(value).toLowerCase())))
const tagByValue = new Map((await listTags()).map((tag) => [tag.value, tag]))
const ensureTag = async (value) => {
  if (tagByValue.has(value)) return tagByValue.get(value)
  if (dryRun) return { id: `dry-${value}`, value }
  const body = await adminFetch("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) })
  const tag = body.product_tag || body.tag
  tagByValue.set(value, tag)
  return tag
}

const report = { started_at: new Date().toISOString(), dry_run: dryRun, source: "Squarespace export", created: [], skipped: [] }
const reviewRows = [["product_code", "product_name", "brand", "model", "colourway", "colour_tags", "source_url", "colour_source", "colour_confidence", "squarespace_source_handle", "squarespace_image_count", "source_eu_sizes", "medusa_product_id", "medusa_handle", "import_status", "notes"]]

for (const product of PRODUCTS.filter((item) => !onlyHandle || item.sourceHandle === onlyHandle)) {
  const sourceRow = exportRows.find((row) => row["Product URL"] === product.sourceHandle)
  if (!sourceRow) throw new Error(`Missing Squarespace export row for ${product.sourceHandle}`)
  const imageUrls = sourceRow["Hosted Image URLs"].trim().split(/\s+/).filter(Boolean)
  const handle = slugify(product.title)
  const externalId = `SQUARESPACE-DRM-${product.code.replace(/[^A-Z0-9]/gi, "").toUpperCase()}`
  const duplicate = [handle, externalId, product.code.toLowerCase(), product.title.toLowerCase()].some((token) => existingTokens.has(token.toLowerCase()))
  const sizes = product.sizes || ALL_SIZES
  const colourTags = product.colours.map((colour) => `colour:${colour}`)
  let status = duplicate ? "skipped_existing" : dryRun ? "dry_run_create" : "create"
  let notes = imageUrls.length < 8 ? `Squarespace export supplies ${imageUrls.length} image(s); preserved as the only permitted image source.` : ""
  let created

  if (!duplicate && !dryRun) {
    const uploadedUrls = []
    for (const [index, imageUrl] of imageUrls.entries()) uploadedUrls.push(await uploadSquarespaceImage(imageUrl, index))
    const tags = []
    for (const value of ["dr-martens", `dr-martens-${slugify(product.model)}`, ...colourTags]) tags.push(await ensureTag(value))
    const variants = sizes.map((size) => ({ title: size, sku: `MUSE-DRM-${product.code.replace(/[^A-Z0-9]/gi, "")}-${size}`, allow_backorder: true, manage_inventory: false, weight: 400, options: { Size: size }, prices: [{ currency_code: "nzd", amount: product.price }, { currency_code: "usd", amount: product.price }, { currency_code: "eur", amount: product.price }], metadata: { eu_size: size, display_size: size, size_system: "eu" } }))
    const payload = { title: product.title, subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end", handle, description: descriptionFor(product), status: "published", discountable: true, weight: 400, external_id: externalId, thumbnail: uploadedUrls[0], images: uploadedUrls.map((url) => ({ url })), options: [{ title: "Size", values: sizes }], variants, shipping_profile_id: IDS.shippingProfile, collection_id: IDS.collection, categories: [{ id: IDS.category }], type_id: IDS.productType, tags: tags.map((tag) => ({ id: tag.id })), sales_channels: [{ id: IDS.salesChannel }], metadata: { source: "squarespace", source_url: sourceRow["Product Page"], source_title: sourceRow.Title, source_export: EXPORT_PATH, product_code: product.code, brand: "Dr. Martens", model: product.model, colourway: product.colourway, colour_tags: colourTags.join(" | "), colour_confidence: product.confidence, colour_source: product.source, source_size_system: "eu", display_size_system: "eu", size_display_note: "Sizes are shown as EU buttons.", squarespace_image_count: imageUrls.length, image_source_policy: "Squarespace export images only" } }
    const body = await adminFetch("/admin/products?fields=id,title,handle,*images,*variants,*tags,metadata", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
    created = body.product
  }
  const record = { product_code: product.code, title: product.title, handle, status, image_count: imageUrls.length, eu_sizes: sizes, price: product.price, product_id: created?.id }
  if (duplicate) report.skipped.push(record); else report.created.push(record)
  reviewRows.push([product.code, product.title, "Dr. Martens", product.model, product.colourway, colourTags.join(" | "), sourceRow["Product Page"], product.source, product.confidence, product.sourceHandle, imageUrls.length, sizes.join(" | "), created?.id || "", handle, status, notes])
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`${status}: ${product.title}`)
}

report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
