import fs from "node:fs/promises"
import path from "node:path"

const BACKEND = "https://appealing-quince-change.medusajs.app"
const ROOT = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE"
const ENV = path.join(ROOT, "muse-medusa-store/.image-upload.env")
const OUT = path.join(ROOT, "medusa-imports/squarespace-nz-stock-jul-20")
const REPORT = path.join(OUT, "nz-stock-remaining-import-report.json")
const REVIEW = path.join(OUT, "nz-stock-remaining-review.csv")
const DRY_RUN = process.argv.includes("--dry-run")

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  sneakers: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  boots: "pcat_01KT3HTPTCWGZ4G8Y5WTGP42C5",
  sandals: "pcat_01KT3HVWSHGSW3S0CW47QYQS4E",
}

const FILES = [
  "/Users/mrburns_mac/Downloads/products_Jul-20_09-34-57AM.csv",
  "/Users/mrburns_mac/Downloads/products_Jul-20_09-36-39AM.csv",
  "/Users/mrburns_mac/Downloads/products_Jul-20_09-37-23AM.csv",
]

const NIKE_SIZES = [
  ["35.5", "M 3.5 / W 5"], ["36", "M 4 / W 5.5"], ["36.5", "M 4.5 / W 6"],
  ["37.5", "M 5 / W 6.5"], ["38", "M 5.5 / W 7"], ["38.5", "M 6 / W 7.5"],
  ["39", "M 6.5 / W 8"], ["40", "M 7 / W 8.5"], ["40.5", "M 7.5 / W 9"],
  ["41", "M 8 / W 9.5"], ["42", "M 8.5 / W 10"], ["42.5", "M 9 / W 10.5"],
  ["43", "M 9.5 / W 11"], ["44", "M 10 / W 11.5"], ["44.5", "M 10.5 / W 12"],
  ["45", "M 11 / W 12.5"], ["45.5", "M 11.5 / W 13"], ["46", "M 12 / W 13.5"],
].map(([eu, display]) => ({ eu, display, sizeSystem: "nike_us_mens_womens" }))
const UGG_SIZES = ["35", "36", "37", "38", "39", "40"].map((eu) => ({ eu, display: eu, sizeSystem: "eu" }))
const BIRK_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"].map((eu) => ({ eu, display: eu, sizeSystem: "eu" }))

// StockX supplies style/colour details. Descriptions below are original MUSE copy.
const PRODUCTS = {
  "nike-air-max-plus-triple-white-womens": {
    title: "Nike Air Max Plus - Triple White", brand: "Nike", model: "Air Max Plus", code: "AJ2029-100",
    colourway: "White/White/White", colours: ["white"], sizes: NIKE_SIZES, stock: { "M 8.5 / W 10": 1 },
    source: "https://stockx.com/nike-air-max-plus-triple-white", category: IDS.sneakers,
    details: "A tonal white mesh and synthetic upper keeps the Tuned Air runner clean, while signature TPU cage lines, visible Air cushioning and a durable rubber outsole retain the Air Max Plus identity.",
  },
  "nike-air-max-plus-3-black-red-womens": {
    title: "Nike Air Max Plus 3 - Black Red", brand: "Nike", model: "Air Max Plus 3", code: "CD6871-004",
    colourway: "Black/White/Red", colours: ["black", "red", "white"], sizes: NIKE_SIZES, stock: { "M 6.5 / W 8": 1 },
    source: "https://stockx.com/nike-air-max-plus-3-black-red-gs", category: IDS.sneakers,
    details: "A black mesh and synthetic upper is sharpened with red accents and moulded heel structure, while visible Tuned Air cushioning carries the late-1990s performance look underfoot.",
  },
  "ugg-ultra-mini-platform-chestnut": {
    title: "UGG Classic Ultra Mini Platform - Chestnut", brand: "UGG", model: "Classic Ultra Mini Platform", code: "1135092-CHE",
    colourway: "Chestnut", colours: ["brown"], sizes: UGG_SIZES, stock: { "36": 1 },
    source: "https://stockx.com/ugg-classic-ultra-mini-platform-chestnut-w", category: IDS.boots,
    details: "The low-cut chestnut suede upper is lined in plush UGGplush wool blend and lifted on a two-inch platform, with an asymmetrical topline, rear pull tab and lightweight Treadlite outsole.",
  },
  "nike-nike-air-max-plus-3-leather-white-black": {
    title: "Nike Air Max Plus 3 Leather - White Black", brand: "Nike", model: "Air Max Plus 3", code: "CK6716-100",
    colourway: "White/Black/White/Chile Red", colours: ["white", "black", "red"], sizes: NIKE_SIZES, stock: { "M 7 / W 8.5": 1 },
    source: "https://stockx.com/nike-air-max-plus-3-leather-white-black", category: IDS.sneakers,
    details: "A crisp white leather upper is framed by contrasting black moulded panels and small Chile Red accents, with visible Air cushioning and the Plus 3's distinctive stabilising heel structure underfoot.",
  },
  "jordan-1-unc": {
    title: "Air Jordan 1 Retro High OG - University Blue", brand: "Jordan", model: "Air Jordan 1 Retro High OG", code: "555088-134",
    colourway: "White/University Blue/Black", colours: ["blue", "white", "black"], sizes: NIKE_SIZES, stock: { "M 7.5 / W 9": 1 },
    source: "https://stockx.com/air-jordan-1-retro-high-white-university-blue-black", category: IDS.sneakers,
    details: "White and black tumbled leather is layered with University Blue Durabuck overlays, finished with a woven Nike Air tongue label, Wings branding at the ankle and a University Blue rubber outsole.",
  },
  "nike-dunk-mocha/brown": {
    title: "Nike Dunk Low - Cacao Wow", brand: "Nike", model: "Dunk Low", code: "DD1503-124",
    colourway: "Sail/Cacao Wow/Coconut Milk", colours: ["brown", "cream", "white"], sizes: NIKE_SIZES,
    stock: { "M 4.5 / W 6": 1, "M 5.5 / W 7": 1, "M 6 / W 7.5": 1, "M 6.5 / W 8": 1, "M 8.5 / W 10": 1 },
    source: "https://stockx.com/nike-dunk-low-cacao-wow-womens", category: IDS.sneakers,
    details: "A Sail leather base is paired with Cacao Wow overlays and Swooshes, while Coconut Milk tones soften the midsole for a warm, neutral take on the classic Dunk Low shape.",
  },
  "nike-dunk-mocha/brown-3lpne": {
    title: "Nike Dunk Low - White Black Panda", brand: "Nike", model: "Dunk Low", code: "DD1503-101",
    colourway: "White/Black", colours: ["white", "black"], sizes: NIKE_SIZES,
    stock: { "M 4 / W 5.5": 1, "M 9.5 / W 11": 1 },
    source: "https://stockx.com/nike-dunk-low-white-black-2021-w", category: IDS.sneakers,
    details: "A white leather base is contrasted by black overlays, Swooshes and outsole sections, creating the simple two-tone Panda finish on the familiar low-profile basketball silhouette.",
  },
  "nike-dunk-unc-blue": {
    title: "Nike Dunk Low - UNC University Blue", brand: "Nike", model: "Dunk Low", code: "DD1391-102",
    colourway: "White/University Blue/White", colours: ["white", "blue"], sizes: NIKE_SIZES, stock: { "M 6.5 / W 8": 1 },
    source: "https://stockx.com/nike-dunk-low-unc-2021", category: IDS.sneakers,
    details: "A white leather base is framed by University Blue overlays and Swooshes, with matching blue-and-white tongue branding and a clean white midsole completing the UNC-inspired palette.",
  },
  "nike-shox-grey-silver-womens": {
    title: "Nike Shox TL - Metallic Silver Wolf Grey", brand: "Nike", model: "Shox TL", code: "HQ4049-001",
    colourway: "Metallic Silver/White/Wolf Grey/Black", colours: ["silver", "grey", "white", "black"], sizes: NIKE_SIZES, stock: {},
    source: "https://stockx.com/nike-shox-tl-metallic-silver-wolf-grey", category: IDS.sneakers,
    details: "Metallic Silver and Wolf Grey panels layer over breathable mesh, while full-length Shox columns, black accents and a rubber outsole give the early-2000s runner its distinctive mechanical profile.",
  },
  "jordan-1-low-travis-scott-black": {
    title: "Travis Scott x Air Jordan 1 Low OG - Black Phantom", brand: "Jordan", model: "Air Jordan 1 Low OG", code: "DM7866-001",
    colourway: "Black/Phantom/Ale Brown/Racer Blue/Team Orange", colours: ["black", "cream", "brown"], sizes: NIKE_SIZES, stock: {},
    source: "https://stockx.com/air-jordan-1-retro-low-og-sp-travis-scott-black-phantom", category: IDS.sneakers,
    details: "A black nubuck upper is traced with contrasting Phantom stitching and Travis Scott's oversized reverse Swoosh, with Cactus Jack details and embroidered heel motifs completing the tonal collaboration.",
  },
  "birkenstock-arizona-black": {
    title: "Birkenstock Arizona Birko-Flor - Black", brand: "Birkenstock", model: "Arizona", code: "51791",
    colourway: "Black", colours: ["black"], sizes: BIRK_SIZES, stock: {},
    source: "https://stockx.com/birkenstock-arizona-birko-flor-black", category: IDS.sandals,
    details: "The classic two-strap Arizona uses a smooth black Birko-Flor upper with adjustable buckles, a suede-lined contoured cork-latex footbed and a lightweight EVA outsole.",
  },
  "birkenstock-arizona-oiled-leather": {
    title: "Birkenstock Arizona Oiled Leather - Habana", brand: "Birkenstock", model: "Arizona", code: "52533",
    colourway: "Habana", colours: ["brown"], sizes: BIRK_SIZES, stock: {},
    source: "https://stockx.com/birkenstock-arizona-oiled-leather-habana", category: IDS.sandals,
    details: "Rich Habana oiled leather gives the two adjustable straps a naturally varied finish, paired with Birkenstock's suede-lined contoured cork-latex footbed and lightweight EVA outsole.",
  },
}

const parseCsv = (text) => {
  const rows = []; let row = [], value = "", quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quoted && c === '"' && text[i + 1] === '"') { value += c; i += 1; continue }
    if (c === '"') { quoted = !quoted; continue }
    if (!quoted && c === ",") { row.push(value); value = ""; continue }
    if (!quoted && (c === "\n" || c === "\r")) { if (c === "\r" && text[i + 1] === "\n") i += 1; row.push(value); rows.push(row); row = []; value = ""; continue }
    value += c
  }
  if (value || row.length) { row.push(value); rows.push(row) }
  const [headers, ...data] = rows
  return data.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}
const esc = (value) => /[",\n]/.test(String(value ?? "")) ? `"${String(value ?? "").replaceAll('"', '""')}"` : String(value ?? "")
const slug = (value) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

await fs.mkdir(OUT, { recursive: true })
const apiKey = (await fs.readFile(ENV, "utf8")).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV}`)
const api = async (route, options = {}) => {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(BACKEND + route, { ...options, headers: { Authorization: `Basic ${apiKey}`, ...(options.headers || {}) }, signal: AbortSignal.timeout(90000) })
    const text = await response.text(); let body
    try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
    if (response.ok) return body
    if (attempt === 4 || response.status < 500) throw new Error(`${options.method || "GET"} ${route} ${response.status}: ${JSON.stringify(body).slice(0, 900)}`)
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
  }
}
const listAll = async (route, key) => { const all = []; for (let offset = 0; ; offset += 100) { const body = await api(`${route}${route.includes("?") ? "&" : "?"}limit=100&offset=${offset}`); const page = body[key] || []; all.push(...page); if (page.length < 100) return all } }
const upload = async (url, index, handle) => {
  const source = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!source.ok) throw new Error(`Image download ${source.status}: ${url}`)
  const bytes = await source.arrayBuffer(); const type = source.headers.get("content-type") || "image/jpeg"
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg"
  const form = new FormData(); form.append("files", new File([bytes], `${slug(handle)}-${index + 1}.${ext}`, { type }))
  const uploaded = await api("/admin/uploads", { method: "POST", body: form })
  if (!uploaded.files?.[0]?.url) throw new Error(`Upload returned no URL: ${url}`)
  return uploaded.files[0].url
}

const rows = []
for (const file of FILES) rows.push(...parseCsv(await fs.readFile(file, "utf8")).map((row) => ({ ...row, __file: file })))
const groups = []; let current
for (const row of rows) {
  if (row["Product ID [Non Editable]"]) {
    current = { id: row["Product ID [Non Editable]"], handle: row["Product URL"], title: row.Title, file: row.__file, price: Number(row["Sale Price"]) > 0 ? Number(row["Sale Price"]) : Number(row.Price), images: (row["Hosted Image URLs"] || "").trim().split(/\s+/).filter(Boolean) }
    groups.push(current)
  }
}
const selected = groups.filter((group) => PRODUCTS[group.handle])
if (selected.length !== Object.keys(PRODUCTS).length) throw new Error(`Expected ${Object.keys(PRODUCTS).length} source products, found ${selected.length}`)

const existing = await listAll("/admin/products?fields=id,title,handle,external_id,metadata", "products")
const tags = await listAll("/admin/product-tags", "product_tags")
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const ensureTag = async (value) => {
  if (tagByValue.has(value)) return tagByValue.get(value)
  if (DRY_RUN) return { id: `dry-${value}`, value }
  const body = await api("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) })
  const tag = body.product_tag || body.tag; tagByValue.set(value, tag); return tag
}

const report = { started_at: new Date().toISOString(), dry_run: DRY_RUN, source_files: FILES, created: [], skipped_existing: [] }
const review = [["source_handle", "title", "product_code", "colourway", "stock_by_size", "price_nzd", "variant_count", "image_count", "stockx_source", "status", "medusa_product_id", "notes"]]
for (const group of selected) {
  const product = PRODUCTS[group.handle]
  const handle = `${slug(`${product.title}-${product.code}`)}-nz-stock`
  const externalId = `NZSTOCK-${group.id.toUpperCase()}`
  const duplicate = existing.find((item) => item.handle === handle || item.external_id === externalId)
  if (duplicate) {
    report.skipped_existing.push({ source_handle: group.handle, product_id: duplicate.id, handle })
    review.push([group.handle, product.title, product.code, product.colourway, JSON.stringify(product.stock), group.price, product.sizes.length, group.images.length, product.source, "skipped_existing", duplicate.id, "Existing exact NZ Stock product retained."])
    continue
  }
  const unknownStockSizes = Object.keys(product.stock).filter((size) => !product.sizes.some((entry) => entry.display === size))
  if (unknownStockSizes.length) throw new Error(`${group.handle}: stock sizes missing from size chart: ${unknownStockSizes.join(", ")}`)
  if (DRY_RUN) {
    report.created.push({ source_handle: group.handle, title: product.title, handle, status: "dry_run_create", stock_by_size: product.stock, variants: product.sizes.length, images: group.images.length })
    review.push([group.handle, product.title, product.code, product.colourway, JSON.stringify(product.stock), group.price, product.sizes.length, group.images.length, product.source, "dry_run_create", "", "Full size run; only specified NZ sizes available."])
    continue
  }
  const uploaded = []
  for (const [index, url] of group.images.entries()) uploaded.push(await upload(url, index, group.handle))
  const productTags = []
  for (const value of [slug(product.brand), `${slug(product.brand)}-${slug(product.model)}`, ...product.colours.map((colour) => `colour:${colour}`)]) productTags.push(await ensureTag(value))
  const description = `${product.title} brings the ${product.model} silhouette into the ${product.colourway} colourway.\n\n${product.details}\n\nThis NZ Stock pair ships from Auckland in 1-3 working days. All standard sizes are shown; unavailable sizes are greyed out.`
  const variants = product.sizes.map((size) => ({
    title: size.display,
    sku: `NZ-${group.id}-${product.code}-${size.eu}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: false, manage_inventory: true, weight: product.brand === "Birkenstock" ? 900 : 400,
    options: { Size: size.display }, prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: group.price })),
    metadata: { eu_size: size.eu, display_size: size.display, size_system: size.sizeSystem, nz_stock_quantity: String(product.stock[size.display] || 0), availability_note: product.stock[size.display] ? "NZ stock" : "Out of stock" },
  }))
  const payload = {
    title: product.title, subtitle: "NZ Stock - Ships in 1-3 days from Auckland", handle, description, status: "published", discountable: true,
    weight: product.brand === "Birkenstock" ? 900 : 400, external_id: externalId, thumbnail: uploaded[0], images: uploaded.map((url) => ({ url })),
    options: [{ title: "Size", values: product.sizes.map((size) => size.display) }], variants,
    shipping_profile_id: IDS.shippingProfile, collection_id: IDS.collection, categories: [{ id: product.category }], type_id: IDS.productType,
    tags: productTags.map((tag) => ({ id: tag.id })), sales_channels: [{ id: IDS.salesChannel }],
    metadata: {
      source: "squarespace_nz_stock", stock_source: "nz_stock", source_export: group.file, squarespace_product_id: group.id, squarespace_source_handle: group.handle,
      product_code: product.code, corrected_product_code: product.code, brand: product.brand, model: product.model, colourway: product.colourway, full_colourway: product.colourway,
      colour_tags: product.colours.map((colour) => `colour:${colour}`).join(" | "), colour_source: product.source, colour_confidence: "verified",
      display_size_system: product.sizes[0].sizeSystem, size_display_note: product.sizes === NIKE_SIZES ? "Nike US men's and women's conversions are shown together." : "Sizes are shown as EU buttons.",
      image_source_policy: "Uploaded to Medusa from user-supplied Squarespace export", squarespace_image_count: group.images.length,
    },
  }
  const created = (await api("/admin/products?fields=id,title,handle,thumbnail,*images,*variants,*variants.inventory_items,*tags,*categories,*collection,*type,metadata", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })).product
  for (const variant of created.variants || []) {
    const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
    if (!itemId) throw new Error(`${created.id}/${variant.id}: missing inventory item`)
    await api(`/admin/inventory-items/${itemId}/location-levels`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ location_id: IDS.aucklandLocation, stocked_quantity: product.stock[variant.title] || 0 }) })
  }
  const record = { source_handle: group.handle, product_id: created.id, title: created.title, handle: created.handle, code: product.code, stock_by_size: product.stock, variants: created.variants.length, images: created.images.length, medusa_image_urls: uploaded }
  report.created.push(record)
  review.push([group.handle, product.title, product.code, product.colourway, JSON.stringify(product.stock), group.price, product.sizes.length, group.images.length, product.source, "created", created.id, "Full size run; only specified NZ sizes available."])
  await fs.writeFile(REPORT, JSON.stringify(report, null, 2))
  console.log(`created: ${created.id} ${created.title}`)
}
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT, JSON.stringify(report, null, 2))
await fs.writeFile(REVIEW, review.map((row) => row.map(esc).join(",")).join("\n"))
console.log(JSON.stringify({ created: report.created.length, skipped_existing: report.skipped_existing.length, report: REPORT, review: REVIEW }, null, 2))
