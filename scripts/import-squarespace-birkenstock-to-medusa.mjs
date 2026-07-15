import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const EXPORT_PATH = "/Users/mrburns_mac/Downloads/products_Jun-21_10-36-19PM.csv"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/squarespace-birkenstock"
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const REVIEW_PATH = path.join(BASE_DIR, "birkenstock-enriched-review.csv")
const ENV_PATH = path.resolve(".image-upload.env")
const dryRun = process.argv.includes("--dry-run")
const onlyHandle = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length)

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HVWSHGSW3S0CW47QYQS4E",
}

// Exact user-supplied size run; products are Standard Delivery and are not inventory-counted.
const SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
const PRICE = 150

// Research URLs identify colourway/model only. Descriptions are original copy.
const PRODUCTS = [
  { sourceHandle: "birkenstock-boston-black", title: "Birkenstock Boston - Black", model: "Boston", colourway: "Black", colours: ["black"], source: "https://stockx.com/birkenstock-boston-leather-black", confidence: "partial", details: "Closed-toe clog with an adjustable instep strap, contoured cork-latex footbed and lightweight EVA outsole." },
  { sourceHandle: "birkenstock-naples-wrapped-suede-leather-taupe", title: "Birkenstock Naples Wrapped Suede Leather - Taupe", model: "Naples", colourway: "Taupe", colours: ["taupe", "beige"], source: "https://stockx.com/en-gb/birkenstock-naples-wrapped-suede-leather-taupe", confidence: "verified", details: "Slip-on moccasin-inspired silhouette with wrapped suede leather, a contoured footbed and an adjustable buckle strap." },
  { sourceHandle: "birkenstock-arizona-white", title: "Birkenstock Arizona - White", model: "Arizona", colourway: "White", colours: ["white"], source: "https://stockx.com/brands/birkenstock?category=shoes&model=arizona&color=white", confidence: "partial", details: "Two-strap sandal with adjustable buckles, Birkenstock's contoured cork-latex footbed and an EVA outsole." },
  { sourceHandle: "birkenstock-boston-black-4rjjj-ej8fh-jxafa-76mtp-33e4x-5jpxa", title: "Birkenstock Arizona - Mocha", model: "Arizona", colourway: "Mocha", colours: ["brown"], source: "https://stockx.com/brands/birkenstock?category=shoes&model=arizona&color=brown", confidence: "partial", details: "Two-strap sandal with adjustable buckles, Birkenstock's contoured cork-latex footbed and an EVA outsole." },
  { sourceHandle: "birkenstock-arizona-taupe", title: "Birkenstock Arizona - Taupe", model: "Arizona", colourway: "Taupe", colours: ["taupe", "beige"], source: "https://stockx.com/brands/birkenstock?category=shoes&model=arizona&color=brown", confidence: "partial", details: "Two-strap sandal with adjustable buckles, Birkenstock's contoured cork-latex footbed and an EVA outsole." },
  { sourceHandle: "birkenstock-milano-black", title: "Birkenstock Milano Birko-Flor - Black", model: "Milano", colourway: "Black", colours: ["black"], source: "https://stockx.com/birkenstock-milano-birko-flor-black", confidence: "verified", details: "Supportive three-strap sandal with an adjustable heel strap, Birko-Flor upper, contoured cork-latex footbed and EVA outsole." },
  { sourceHandle: "birkenstock-boston-black-y4ejf", title: "Birkenstock Boston Oiled Leather - Black", model: "Boston", colourway: "Black", colours: ["black"], source: "https://stockx.com/zh-cn/birkenstock-boston-oiled-leather-regular-wide-fit-black", confidence: "verified", details: "Closed-toe clog in oiled leather with an adjustable buckle, contoured cork-latex footbed and EVA outsole." },
  { sourceHandle: "birkenstock-boston-black-y4ejf-hxer3", title: "Birkenstock Boston Soft Footbed Suede - Faded Khaki", model: "Boston", colourway: "Faded Khaki", colours: ["khaki", "beige"], source: "https://stockx.com/birkenstock-boston-soft-footbed-suede-faded-khaki", confidence: "verified", details: "Suede clog in Faded Khaki with an adjustable buckle, soft footbed, contoured cork-latex base and EVA outsole." },
  { sourceHandle: "birkenstock-boston-black-y4ejf-hxer3-hdyck", title: "Birkenstock Boston Soft Footbed Suede - Mocha", model: "Boston", colourway: "Mocha Brown", colours: ["brown"], source: "https://stockx.com/en-gb/birkenstock-boston-soft-footbed-suede-mocha?size=45", confidence: "verified", details: "Suede clog in Mocha Brown with an adjustable buckle, soft footbed, contoured cork-latex base and EVA outsole." },
  { sourceHandle: "birkenstock-arizona-matte-black", title: "Birkenstock Arizona - Matte Black", model: "Arizona", colourway: "Matte Black", colours: ["black"], source: "https://stockx.com/brands/birkenstock?category=shoes&model=arizona&color=black", confidence: "partial", details: "Two-strap sandal with adjustable buckles, Birkenstock's contoured cork-latex footbed and an EVA outsole." },
]

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const parseCsv = (text) => {
  const rows = []; let row = [], field = "", quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted && char === '"' && text[i + 1] === '"') { field += char; i += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (!quoted && char === ",") { row.push(field); field = ""; continue }
    if (!quoted && (char === "\n" || char === "\r")) { if (char === "\r" && text[i + 1] === "\n") i += 1; row.push(field); rows.push(row); row = []; field = ""; continue }
    field += char
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [headers, ...data] = rows
  return data.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}

const slugify = (value) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const descriptionFor = (product) => `${product.title} brings Birkenstock's recognisable ${product.model} silhouette in a ${product.colourway.toLowerCase()} colourway.\n\n${product.details}\n\nA versatile everyday option, it pairs easily with relaxed, casual rotation.`

await fs.mkdir(BASE_DIR, { recursive: true })
const exportRows = parseCsv(await fs.readFile(EXPORT_PATH, "utf8"))
const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

const adminFetch = async (url, options = {}) => {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(`${BACKEND_URL}${url}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } })
    const text = await response.text(); let body
    try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
    if (response.ok) return body
    if (response.status < 500 || attempt === 4) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
    await new Promise((resolve) => setTimeout(resolve, attempt * 2500))
  }
}

const listAll = async (url, key) => { const result = []; for (let offset = 0; ; offset += 100) { const page = await adminFetch(`${url}${url.includes("?") ? "&" : "?"}limit=100&offset=${offset}`); const items = page[key] || []; result.push(...items); if (items.length < 100) return result } }
const uploadSquarespaceImage = async (url, index) => {
  const image = await fetch(url)
  if (!image.ok) throw new Error(`Squarespace image download failed ${image.status}: ${url}`)
  const bytes = await image.arrayBuffer(); const contentType = image.headers.get("content-type") || "image/jpeg"
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
  const form = new FormData(); form.append("files", new File([bytes], `squarespace-birkenstock-${index + 1}.${ext}`, { type: contentType }))
  const body = await adminFetch("/admin/uploads", { method: "POST", body: form })
  if (!body.files?.[0]?.url) throw new Error(`Upload returned no URL for image ${index + 1}`)
  return body.files[0].url
}

const existingProducts = await listAll("/admin/products?fields=id,title,handle,external_id,metadata", "products")
const tags = await listAll("/admin/product-tags", "product_tags")
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const ensureTag = async (value) => {
  if (tagByValue.has(value)) return tagByValue.get(value)
  if (dryRun) return { id: `dry-${value}`, value }
  const body = await adminFetch("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) })
  const tag = body.product_tag || body.tag; tagByValue.set(value, tag); return tag
}
const tokens = new Set(existingProducts.flatMap((p) => [p.title, p.handle, p.external_id, p.metadata?.product_code].filter(Boolean).map((v) => String(v).toLowerCase())))
const report = { started_at: new Date().toISOString(), dry_run: dryRun, source: EXPORT_PATH, created: [], skipped: [] }
const reviewRows = [["product_code", "product_name", "brand", "model", "colourway", "primary_colour", "colour_tags", "seo_title", "meta_description", "url_slug", "product_details", "source_url", "source_title", "colour_source", "colour_confidence", "squarespace_source_handle", "squarespace_image_count", "medusa_product_id", "medusa_handle", "import_status", "notes"]]

for (const product of PRODUCTS.filter((item) => !onlyHandle || item.sourceHandle === onlyHandle)) {
  const row = exportRows.find((item) => item["Product URL"] === product.sourceHandle)
  if (!row) throw new Error(`Missing Squarespace source row: ${product.sourceHandle}`)
  const productCode = `SQUARESPACE-BIRKENSTOCK-${row["Product ID [Non Editable]"].toUpperCase()}`
  const handle = slugify(product.title)
  const duplicate = [productCode, handle, product.title].some((value) => tokens.has(value.toLowerCase()))
  const imageUrls = row["Hosted Image URLs"].trim().split(/\s+/).filter(Boolean)
  const colourTags = product.colours.map((colour) => `colour:${colour}`)
  let created; const status = duplicate ? "skipped_existing" : dryRun ? "dry_run_create" : "create"
  let notes = product.confidence === "partial" ? "Model and colour come from the Squarespace title; public source supports the model family but not an exact SKU." : ""
  if (!duplicate && !dryRun) {
    const uploadedUrls = []
    for (const [index, url] of imageUrls.entries()) uploadedUrls.push(await uploadSquarespaceImage(url, index))
    const productTags = []
    for (const value of ["birkenstock", `birkenstock-${slugify(product.model)}`, ...colourTags]) productTags.push(await ensureTag(value))
    const body = await adminFetch("/admin/products?fields=id,title,handle,external_id,thumbnail,*images,*variants,*tags,metadata", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      title: product.title, subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end", handle, description: descriptionFor(product), status: "published", discountable: true, weight: 900, external_id: productCode,
      thumbnail: uploadedUrls[0], images: uploadedUrls.map((url) => ({ url })), options: [{ title: "Size", values: SIZES }],
      variants: SIZES.map((size) => ({ title: size, sku: `MUSE-BIRK-${productCode}-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(), allow_backorder: true, manage_inventory: false, weight: 900, options: { Size: size }, prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })), metadata: { eu_size: size, display_size: size, size_system: "eu" } })),
      shipping_profile_id: IDS.shippingProfile, collection_id: IDS.collection, categories: [{ id: IDS.category }], type_id: IDS.productType, tags: productTags.map((tag) => ({ id: tag.id })), sales_channels: [{ id: IDS.salesChannel }],
      metadata: { source: "squarespace", source_export: EXPORT_PATH, source_url: row["Product Page"], source_title: row.Title, squarespace_product_id: row["Product ID [Non Editable]"], product_code: productCode, brand: "Birkenstock", model: product.model, colourway: product.colourway, colour_tags: colourTags.join(" | "), colour_confidence: product.confidence, colour_source: product.source, source_size_system: "eu", display_size_system: "eu", size_display_note: "Sizes are shown as EU buttons.", squarespace_image_count: imageUrls.length, image_source_policy: "Squarespace export images only" }
    }) })
    created = body.product
  }
  const record = { product_code: productCode, title: product.title, handle, status, image_count: imageUrls.length, eu_sizes: SIZES, price: PRICE, product_id: created?.id }
  if (duplicate) report.skipped.push(record); else report.created.push(record)
  reviewRows.push([productCode, product.title, "Birkenstock", product.model, product.colourway, product.colours[0], colourTags.join(" | "), `${product.title} | MUSE NZ`, `Shop ${product.title} at MUSE NZ. Available in EU sizes 35-45.`, handle, product.details, row["Product Page"], row.Title, product.source, product.confidence, product.sourceHandle, imageUrls.length, created?.id || "", handle, status, notes])
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`${status}: ${product.title}`)
}
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
