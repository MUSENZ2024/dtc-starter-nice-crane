import fs from "node:fs/promises"
import path from "node:path"

const BACKEND = "https://appealing-quince-change.medusajs.app"
const ENV = path.resolve(".image-upload.env")
const OUT = path.resolve("../medusa-imports/squarespace-nz-stock-jul-20")
const REVIEW = path.join(OUT, "nz-stock-review.csv")
const REPORT = path.join(OUT, "nz-stock-import-report.json")
const DRY_RUN = process.argv.includes("--dry-run")

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
}

const FILES = [
  "/Users/mrburns_mac/Downloads/products_Jul-20_09-34-57AM.csv",
  "/Users/mrburns_mac/Downloads/products_Jul-20_09-36-39AM.csv",
  "/Users/mrburns_mac/Downloads/products_Jul-20_09-37-23AM.csv",
]

// Only exact, previously researched Standard Delivery counterparts are imported.
// Ambiguous listings remain in the review CSV and are not guessed.
const MATCHES = {
  "birkenstock-arizona-matte-black": { standardId: "prod_01KVMXQRH24XF3FWA2BA2HB99N" },
  "birkenstock-arizona-taupe": { standardId: "prod_01KVMXFY3GNCA3ANH6G2RDFGKN" },
  "new-balance-9060-seasalt": {
    standardId: "prod_01KVD564ZHQRRTMARKM8M2M9PP",
    title: "New Balance 9060 - Sea Salt",
    handle: "new-balance-9060-sea-salt-u9060mac-nz-stock",
    colourway: "Sea Salt/Surf",
    productCode: "U9060MAC",
    colourTags: ["colour:cream", "colour:white", "colour:blue"],
    colourSource: "https://stockx.com/new-balance-9060-sea-salt",
    description: `The New Balance 9060 Sea Salt brings the model's exaggerated retro-future shape into a soft Sea Salt and Surf colourway.

Its upper combines breathable mesh with premium pig-suede overlays, using warm off-white tones and subtle cool accents for an easy everyday finish.

The sculpted midsole draws from New Balance's 99X running heritage, with ABZORB and SBS cushioning underfoot and the distinctive split heel that defines the 9060.

Style U9060MAC balances layered early-2000s runner detailing with a neutral palette that works easily with denim, cargos, and relaxed everyday outfits.`,
  },
  "new-balance-9060-quartz-grey": {
    standardId: "prod_01KVD577W88Z0VX9RAVXAT8742",
    title: "New Balance 9060 - Quartz Grey",
    handle: "new-balance-9060-quartz-grey-u9060hsa-nz-stock",
    colourway: "Quartz Grey/Team Cream/Sea Salt",
    productCode: "U9060HSA",
    colourTags: ["colour:grey", "colour:cream", "colour:white"],
    colourSource: "https://stockx.com/new-balance-9060-quartz-grey-team-cream-sea-salt",
    description: `The New Balance 9060 Quartz Grey pairs the model's bold 99X-inspired profile with a muted Quartz Grey, Team Cream, and Sea Salt palette.

Premium suede overlays sit across a breathable mesh base, giving the upper a layered look while keeping the neutral colourway versatile for everyday wear.

Underfoot, the sculpted sole combines ABZORB and SBS cushioning with the widened 9060 heel for a comfortable, supportive feel and a distinctive retro-future stance.

Style U9060HSA works easily with tonal outfits, denim, cargos, and relaxed streetwear while retaining the technical detailing that makes the 9060 recognisable.`,
  },
  "new-balance-9060-turtledove": {
    standardId: "prod_01KVCDQBDB0XCKME1MJ80C513R",
    title: "New Balance 9060 - Turtledove",
    handle: "new-balance-9060-turtledove-u9060tat-nz-stock",
    colourway: "Turtledove/Turtledove",
    productCode: "U9060TAT",
    colourTags: ["colour:cream", "colour:beige", "colour:grey"],
    colourSource: "https://stockx.com/new-balance-9060-turtledove",
    description: `The New Balance 9060 Turtledove reworks the model's early-2000s technical runner influence in a soft, tonal neutral colourway.

Lightweight ivory mesh forms the base of the upper, while suede and smooth leather overlays move from creamy white through warm tan in layered, wave-like panels.

The translucent heel device adds stability, and the sculpted four-tone midsole uses ABZORB and SBS ABZORB cushioning for a supportive feel with strong visual presence.

Style U9060TAT finishes the look with a dark rubber outsole and beige traction pods inspired by the New Balance 860, making it an easy match for neutral and earth-toned outfits.`,
  },
  "dr-marten-cherry-red": {
    standardId: "prod_01KVMWJKACJX9543K6KHW4QKZH",
    sourceSizeToStandard: { "9.5w": "43" },
  },
  "jordan-1-low-travis-scott-olive": {
    standardId: "prod_01KVMZ4KPWBMF0K6DHQM45Y3FW",
    sourceSizeToStandard: { "8 womans": "39", "10 womans": "41" },
  },
}

const parseCsv = (text) => {
  const rows = []
  let row = [], value = "", quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quoted && c === '"' && text[i + 1] === '"') { value += c; i += 1; continue }
    if (c === '"') { quoted = !quoted; continue }
    if (!quoted && c === ",") { row.push(value); value = ""; continue }
    if (!quoted && (c === "\n" || c === "\r")) {
      if (c === "\r" && text[i + 1] === "\n") i += 1
      row.push(value); rows.push(row); row = []; value = ""; continue
    }
    value += c
  }
  if (value || row.length) { row.push(value); rows.push(row) }
  const [head, ...body] = rows
  return body.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] || ""])))
}

const esc = (value) => /[",\n]/.test(String(value ?? ""))
  ? `"${String(value ?? "").replaceAll('"', '""')}"`
  : String(value ?? "")
const slug = (value) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const cleanSize = (value) => String(value || "").trim().toLowerCase()
const numericStock = (value) => /^unlimited$/i.test(String(value || "").trim()) ? 1 : Math.max(0, Number(value) || 0)

await fs.mkdir(OUT, { recursive: true })
const apiKey = (await fs.readFile(ENV, "utf8")).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV}`)
const auth = { Authorization: `Basic ${apiKey}` }

const api = async (url, options = {}) => {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(BACKEND + url, { ...options, headers: { ...auth, ...(options.headers || {}) } })
    const text = await response.text()
    let body
    try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
    if (response.ok) return body
    if (attempt === 4 || response.status < 500) throw new Error(`${options.method || "GET"} ${url} ${response.status}: ${JSON.stringify(body).slice(0, 800)}`)
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
  }
}

const upload = async (url, index, handle) => {
  const source = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!source.ok) throw new Error(`Squarespace image download ${source.status}: ${url}`)
  const bytes = await source.arrayBuffer()
  const type = source.headers.get("content-type") || "image/jpeg"
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg"
  const form = new FormData()
  form.append("files", new File([bytes], `${handle}-${index + 1}.${ext}`, { type }))
  const uploaded = await api("/admin/uploads", { method: "POST", body: form })
  if (!uploaded.files?.[0]?.url) throw new Error(`Upload returned no URL for ${url}`)
  return uploaded.files[0].url
}

const sourceRows = []
for (const file of FILES) sourceRows.push(...parseCsv(await fs.readFile(file, "utf8")).map((row) => ({ ...row, __file: file })))
const groups = []
let current
for (const row of sourceRows) {
  if (row["Product ID [Non Editable]"]) {
    current = { productId: row["Product ID [Non Editable]"], handle: row["Product URL"], title: row.Title, file: row.__file, images: (row["Hosted Image URLs"] || "").trim().split(/\s+/).filter(Boolean), rows: [] }
    groups.push(current)
  }
  current?.rows.push(row)
}

const existing = []
for (let offset = 0; ; offset += 100) {
  const body = await api(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,metadata`)
  existing.push(...(body.products || []))
  if ((body.products || []).length < 100) break
}

const allTags = []
for (let offset = 0; ; offset += 100) {
  const body = await api(`/admin/product-tags?limit=100&offset=${offset}`)
  const page = body.product_tags || body.tags || []
  allTags.push(...page)
  if (page.length < 100) break
}
const tagByValue = new Map(allTags.map((tag) => [tag.value, tag]))

const report = { started_at: new Date().toISOString(), dry_run: DRY_RUN, source_files: FILES, created: [], skipped_existing: [], needs_review: [] }
const review = [["source_handle", "source_title", "standard_product_id", "standard_title", "standard_handle", "source_sizes", "stock_by_standard_size", "image_count", "status", "notes"]]

for (const group of groups) {
  const match = MATCHES[group.handle]
  if (!match) {
    const item = { source_handle: group.handle, source_title: group.title, reason: "No exact Standard Delivery counterpart was verified; no live product created." }
    report.needs_review.push(item)
    review.push([group.handle, group.title, "", "", "", group.rows.map((r) => r["Option Value 1"]).filter(Boolean).join(" | "), "", group.images.length, "needs_review", item.reason])
    continue
  }

  const standard = (await api(`/admin/products/${match.standardId}?fields=id,title,handle,subtitle,description,weight,*variants,*variants.options,*tags,*categories,*collection,*type,metadata`)).product
  if (!standard || standard.collection?.title !== "Standard Delivery") throw new Error(`${group.handle}: verified counterpart is not a Standard Delivery product`)
  const productTitle = match.title || standard.title
  const handle = match.handle || `${standard.handle}-nz-stock`
  const externalId = `NZSTOCK-${group.productId.toUpperCase()}`
  const duplicate = existing.find((p) => p.handle === handle || p.external_id === externalId)
  const stockByStandardSize = {}
  for (const row of group.rows) {
    const sourceSize = cleanSize(row["Option Value 1"])
    const standardSize = match.sourceSizeToStandard?.[sourceSize] || String(row["Option Value 1"] || "").trim()
    if (standardSize) stockByStandardSize[standardSize] = (stockByStandardSize[standardSize] || 0) + numericStock(row.Stock)
  }
  const standardSizes = standard.variants.map((v) => String(v.options?.[0]?.value || v.title))
  const unmappedPositive = Object.entries(stockByStandardSize).filter(([size, qty]) => qty > 0 && !standardSizes.includes(size))
  if (unmappedPositive.length) throw new Error(`${group.handle}: positive stock could not map to the standard size run: ${JSON.stringify(unmappedPositive)}`)
  const effectivePrice = Number(group.rows[0]["Sale Price"]) > 0 ? Number(group.rows[0]["Sale Price"]) : Number(group.rows[0].Price)

  if (duplicate) {
    report.skipped_existing.push({ source_handle: group.handle, product_id: duplicate.id, handle })
    review.push([group.handle, group.title, standard.id, standard.title, standard.handle, group.rows.map((r) => r["Option Value 1"]).filter(Boolean).join(" | "), JSON.stringify(stockByStandardSize), group.images.length, "skipped_existing", duplicate.id])
    continue
  }

  const baseRecord = { source_handle: group.handle, standard_product_id: standard.id, standard_title: standard.title, title: productTitle, handle, variants: standardSizes.length, stock_by_size: stockByStandardSize, image_count: group.images.length, price: effectivePrice }
  if (DRY_RUN) {
    report.created.push({ ...baseRecord, status: "dry_run_create" })
    review.push([group.handle, group.title, standard.id, productTitle, standard.handle, group.rows.map((r) => r["Option Value 1"]).filter(Boolean).join(" | "), JSON.stringify(stockByStandardSize), group.images.length, "dry_run_create", match.description ? "9060 structure and size run reused from Standard Delivery; title, description, and colour metadata corrected from StockX research." : "Exact description, tags, category, metadata, and size run will be cloned from the Standard Delivery counterpart."])
    continue
  }

  const imageUrls = []
  for (const [index, url] of group.images.entries()) imageUrls.push(await upload(url, index, group.handle))
  const variants = standard.variants.map((variant) => {
    const size = String(variant.options?.[0]?.value || variant.title)
    return {
      title: variant.title,
      sku: `NZ-${group.productId}-${slug(size)}`.toUpperCase(),
      allow_backorder: false,
      manage_inventory: true,
      weight: variant.weight || standard.weight || 400,
      options: { Size: size },
      prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: effectivePrice })),
      metadata: { ...(variant.metadata || {}), nz_stock_quantity: String(stockByStandardSize[size] || 0), availability_note: stockByStandardSize[size] ? "NZ stock" : "Out of stock" },
    }
  })
  const productTags = match.colourTags
    ? ["new-balance", "new-balance-9060", ...match.colourTags].map((value) => {
        const tag = tagByValue.get(value)
        if (!tag) throw new Error(`${group.handle}: required tag does not exist: ${value}`)
        return { id: tag.id }
      })
    : standard.tags.map((tag) => ({ id: tag.id }))
  const payload = {
    title: productTitle,
    subtitle: "NZ Stock - Ships in 1-3 days from Auckland",
    handle,
    description: match.description || standard.description,
    status: "published",
    discountable: true,
    weight: standard.weight || 400,
    external_id: externalId,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [{ title: "Size", values: standardSizes }],
    variants,
    shipping_profile_id: IDS.shippingProfile,
    collection_id: IDS.collection,
    categories: standard.categories.map((category) => ({ id: category.id })),
    type_id: IDS.productType,
    tags: productTags,
    sales_channels: [{ id: IDS.salesChannel }],
    metadata: {
      ...(standard.metadata || {}),
      source: "squarespace_nz_stock",
      stock_source: "nz_stock",
      source_export: group.file,
      squarespace_product_id: group.productId,
      squarespace_source_handle: group.handle,
      standard_product_id: standard.id,
      ...(match.productCode ? {
        product_code: match.productCode,
        corrected_product_code: match.productCode,
        colourway: match.colourway,
        full_colourway: match.colourway,
        colour_tags: match.colourTags.join(" | "),
        colour_source: match.colourSource,
        colour_confidence: "verified",
      } : {}),
      image_source_policy: "Uploaded to Medusa from user-supplied Squarespace export",
      squarespace_image_count: group.images.length,
    },
  }
  const created = (await api("/admin/products?fields=id,title,handle,thumbnail,*images,*variants,*variants.inventory_items,*tags,*categories,*collection,*type,metadata", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })).product
  for (const variant of created.variants || []) {
    const size = String(variant.title)
    const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
    if (!itemId) throw new Error(`${created.id}/${variant.id}: inventory item was not created`)
    await api(`/admin/inventory-items/${itemId}/location-levels`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ location_id: IDS.aucklandLocation, stocked_quantity: stockByStandardSize[size] || 0 }) })
  }
  report.created.push({ ...baseRecord, status: "created", product_id: created.id, medusa_image_urls: imageUrls })
  review.push([group.handle, group.title, standard.id, standard.title, standard.handle, group.rows.map((r) => r["Option Value 1"]).filter(Boolean).join(" | "), JSON.stringify(stockByStandardSize), group.images.length, "created", created.id])
  await fs.writeFile(REPORT, JSON.stringify(report, null, 2))
  console.log(`created: ${created.id} ${created.title}`)
}

report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT, JSON.stringify(report, null, 2))
await fs.writeFile(REVIEW, review.map((row) => row.map(esc).join(",")).join("\n"))
console.log(`Created/dry-run: ${report.created.length}; skipped existing: ${report.skipped_existing.length}; needs review: ${report.needs_review.length}`)
console.log(`Review: ${REVIEW}`)
console.log(`Report: ${REPORT}`)
