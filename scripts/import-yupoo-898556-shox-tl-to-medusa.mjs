import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-898556"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "nike-shox-tl-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const SOURCE_CATEGORY = "https://yolo66.x.yupoo.com/categories/898556?isSubCate=true"

const SIZES = [
  { eu_size: "36", us_mens_size: "4", us_womens_size: "5.5", uk_size: "3.5", cm_jp_size: "23", display_size: "M 4 / W 5.5" },
  { eu_size: "37", us_mens_size: "5", us_womens_size: "6.5", uk_size: "4.5", cm_jp_size: "23.5", display_size: "M 5 / W 6.5" },
  { eu_size: "38", us_mens_size: "5.5", us_womens_size: "7", uk_size: "5", cm_jp_size: "24", display_size: "M 5.5 / W 7" },
  { eu_size: "39", us_mens_size: "6.5", us_womens_size: "8", uk_size: "6", cm_jp_size: "24.5", display_size: "M 6.5 / W 8" },
  { eu_size: "40", us_mens_size: "7", us_womens_size: "8.5", uk_size: "6", cm_jp_size: "25", display_size: "M 7 / W 8.5" },
  { eu_size: "41", us_mens_size: "8", us_womens_size: "9.5", uk_size: "7", cm_jp_size: "26", display_size: "M 8 / W 9.5" },
  { eu_size: "42", us_mens_size: "8.5", us_womens_size: "10", uk_size: "7.5", cm_jp_size: "26.5", display_size: "M 8.5 / W 10" },
  { eu_size: "43", us_mens_size: "9.5", us_womens_size: "11", uk_size: "8.5", cm_jp_size: "27.5", display_size: "M 9.5 / W 11" },
  { eu_size: "44", us_mens_size: "10", us_womens_size: "11.5", uk_size: "9", cm_jp_size: "28", display_size: "M 10 / W 11.5" },
  { eu_size: "45", us_mens_size: "11", us_womens_size: "12.5", uk_size: "10", cm_jp_size: "29", display_size: "M 11 / W 12.5" },
]
const PRICE = 160

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const CODE_CORRECTIONS = {
  "1B7705-001": "IB7705-001",
  "1Q6599-002": "IQ6599-002",
  "C10987-006": "CI0987-006",
}

const PRODUCT_DATA = {
  "IB4340-200": { name: "Velvet Brown Denim Turquoise", colourway: "Velvet Brown/Desert Khaki/Denim Turquoise", colours: ["brown", "beige", "blue"], confidence: "verified", source: "StockX" },
  "HV2520-001": { name: "Pink Foam", colourway: "Metallic Platinum/Pink Foam/White/Pinksicle", colours: ["silver", "pink", "white"], confidence: "verified", source: "StockX" },
  "AR3566-102": { name: "White Multi-Color", colourway: "White/Black/Luminous Green/Bright Violet/Pink Blast/Aurora Green", colours: ["white", "black", "green", "purple", "pink"], confidence: "verified", source: "StockX" },
  "AR3566-009": { name: "Wolf Grey Metallic Silver", colourway: "Wolf Grey/Metallic Silver", colours: ["grey", "silver"], confidence: "verified", source: "StockX" },
  "CI7691-001": { name: "Viotech", colourway: "Atmosphere Grey/Viotech/Orange Peel", colours: ["grey", "purple", "orange"], confidence: "verified", source: "StockX" },
  "HJ9609-001": { name: "Volt Fire Red", colourway: "Black/Volt/Fire Red/Black", colours: ["black", "green", "red"], confidence: "verified", source: "StockX" },
  "IQ0314-010": { name: "Black Volt Metallic Silver", colourway: "Black/Volt/Metallic Silver", colours: ["black", "green", "silver"], confidence: "verified", source: "StockX" },
  "IB7705-001": { name: "Off Noir Metallic Silver", colourway: "Off Noir/Metallic Silver", colours: ["black", "silver"], confidence: "verified", source: "StockX" },
  "AR3566-201": { name: "Khaki Ironstone Off Noir", colourway: "Khaki/Ironstone/Off Noir", colours: ["beige", "brown", "black"], confidence: "verified", source: "StockX" },
  "HQ4049-001": { name: "Metallic Silver Wolf Grey", colourway: "Metallic Silver/Wolf Grey", colours: ["silver", "grey"], confidence: "verified", source: "StockX" },
  "IH4481-400": { name: "Obsidian Light Armory Blue", colourway: "Obsidian/Light Armory Blue", colours: ["blue"], confidence: "verified", source: "StockX" },
  "IH4485-001": { name: "Black Playful Pink", colourway: "Black/Playful Pink/Pink Foam/Off Noir", colours: ["black", "pink"], confidence: "verified", source: "StockX" },
  "AV3595-400": { name: "Hyper Royal", colourway: "Hyper Royal/Metallic Silver/Black", colours: ["blue", "silver", "black"], confidence: "verified", source: "StockX" },
  "AV3595-500": { name: "Voltage Purple", colourway: "Voltage Purple/Black/Metallic Silver", colours: ["purple", "black", "silver"], confidence: "verified", source: "StockX" },
  "AV3595-013": { name: "Black University Gold", colourway: "Black/University Gold", colours: ["black", "yellow"], confidence: "verified", source: "StockX" },
  "IF7119-001": { name: "Black Varsity Maize", colourway: "Black/Varsity Maize/Metallic Silver", colours: ["black", "yellow", "silver"], confidence: "verified", source: "StockX" },
  "IH4466-095": { name: "Metallic Silver", colourway: "Metallic Silver/Wolf Grey/Anthracite/Summit White", colours: ["silver", "grey", "white"], confidence: "verified", source: "StockX" },
  "IH1336-600": { name: "Fade Watermelon", colourway: "Fade Watermelon", colours: ["pink", "green"], confidence: "verified", source: "StockX" },
  "AV3595-016": { name: "Black Light Crimson", colourway: "Black/Light Crimson/Metallic Silver", colours: ["black", "red", "silver"], confidence: "verified", source: "StockX" },
  "AV3595-012": { name: "Black Green Strike", colourway: "Black/Black/Green Strike", colours: ["black", "green"], confidence: "verified", source: "StockX" },
  "AV3595-102": { name: "White Platinum", colourway: "White/Platinum", colours: ["white", "silver"], confidence: "verified", source: "StockX" },
  "BV1127-600": { name: "Speed Red", colourway: "Speed Red/Metallic Silver/Black", colours: ["red", "silver", "black"], confidence: "verified", source: "StockX" },
  "BV1127-800": { name: "Total Orange", colourway: "Total Orange/Metallic Silver/Total Orange", colours: ["orange", "silver"], confidence: "verified", source: "StockX" },
  "AR3566-401": { name: "Blue Tint Orange", colourway: "Blue Tint/Black/Total Orange", colours: ["blue", "black", "orange"], confidence: "verified", source: "StockX" },
  "AR3566-002": { name: "Black Max Orange", colourway: "Black/Metallic Hematite/Max Orange", colours: ["black", "grey", "orange"], confidence: "verified", source: "StockX" },
  "AR3566-100": { name: "White Metallic Silver Max Orange", colourway: "White/Metallic Silver/Max Orange/White", colours: ["white", "silver", "orange"], confidence: "verified", source: "StockX" },
  "AR3566-203": { name: "Linen Metallic Silver", colourway: "Linen/Metallic Silver", colours: ["beige", "silver"], confidence: "verified", source: "StockX" },
  "AR3566-007": { name: "Cannon", colourway: "Cannon", colours: ["grey"], confidence: "verified", source: "StockX" },
}

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[().']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const titleCase = (value) =>
  String(value)
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")

const descriptionFor = (name, colours, code) => {
  const colourText = colours.length ? colours.map(titleCase).join(", ").toLowerCase() : "technical sportstyle"
  return [
    `The Nike Shox TL ${name} brings the silhouette's distinctive full-length Shox columns into a ${colourText} colour palette.`,
    "A layered mesh and synthetic upper gives the sneaker its early-2000s runner look, while the visible Shox cushioning keeps the profile instantly recognisable.",
    `Style ${code} works as a statement everyday sneaker, pairing well with relaxed denim, cargos, technical pants, and simple streetwear layers.`,
    "The sculpted sole, supportive cage, and bold panel work give the Shox TL a sharp, futuristic finish without losing its retro Nike energy.",
  ].join("\n\n")
}

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }
const dryRun = process.argv.includes("--dry-run")

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body
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

const listProducts = async () => {
  const products = []
  for (let offset = 0; offset < 5000; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,metadata`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) break
  }
  return products
}

const listTags = async () => {
  const tags = []
  for (let offset = 0; offset < 1000; offset += 100) {
    const body = await adminFetch(`/admin/product-tags?limit=100&offset=${offset}`)
    const page = body.product_tags || body.tags || []
    tags.push(...page)
    if (page.length < 100) break
  }
  return tags
}

const ensureTag = async (tagByValue, value) => {
  if (tagByValue.has(value)) return tagByValue.get(value)
  if (dryRun) return { id: `dry-${value}`, value }
  const body = await adminFetch("/admin/product-tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value }),
  })
  const tag = body.product_tag || body.tag
  tagByValue.set(value, tag)
  return tag
}

const productCodesFrom = (product) => {
  const codes = []
  for (const value of [product.external_id, product.metadata?.product_code, product.metadata?.corrected_product_code]) {
    const match = String(value || "").match(/\b[A-Z0-9]{2}\d{4}-\d{3}\b|\b[A-Z]{2}\d{4}-\d{3}\b/)
    if (match) codes.push(match[0])
  }
  return codes
}

const raw = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
const products = await listProducts()
const existingCodes = new Set(products.flatMap(productCodesFrom).filter(Boolean))
const existingHandles = new Set(products.map((product) => product.handle).filter(Boolean))
const tags = await listTags()
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const baseTags = ["nike", "nike-shox-tl"]
for (const tag of baseTags) await ensureTag(tagByValue, tag)

const reviewRows = [[
  "product_code",
  "corrected_product_code",
  "product_name",
  "url_slug",
  "colourway",
  "colour_tags",
  "colour_source",
  "colour_confidence",
  "source_url",
  "source_title",
  "local_folder",
  "local_image_count",
  "medusa_product_id",
  "medusa_handle",
  "import_status",
  "notes",
]]

const report = { started_at: new Date().toISOString(), dry_run: dryRun, created: [], skipped: [], needs_review: [] }
const batchCodes = new Set()
const batchHandles = new Set()

for (const album of raw) {
  const rawCode = album.product_code
  const code = CODE_CORRECTIONS[rawCode] || rawCode
  const info = PRODUCT_DATA[code]

  if (!info) {
    reviewRows.push([
      rawCode,
      code,
      "",
      "",
      "",
      "",
      "StockX search attempted",
      "needs review",
      album.source_url,
      album.source_title,
      album.local_folder,
      album.local_images?.length || 0,
      "",
      "",
      "needs_review",
      "No exact StockX/source match captured yet; not imported.",
    ])
    report.needs_review.push({ code, raw_code: rawCode, source_title: album.source_title, reason: "missing verified product data" })
    continue
  }

  const title = `Nike Shox TL - ${info.name}`
  const handle = slugify(`nike-shox-tl-${info.name}`)
  const tagValues = [...baseTags, ...info.colours.map((colour) => `colour:${colour}`)]
  const existing = existingCodes.has(code) || existingHandles.has(handle) || batchCodes.has(code) || batchHandles.has(handle)

  if (existing) {
    reviewRows.push([
      rawCode,
      code,
      title,
      handle,
      info.colourway,
      info.colours.map((colour) => `colour:${colour}`).join(" | "),
      info.source,
      info.confidence,
      album.source_url,
      album.source_title,
      album.local_folder,
      album.local_images?.length || 0,
      "",
      handle,
      "skipped_existing",
      "Already present in Medusa or duplicated within this Yupoo batch; not duplicated or replaced.",
    ])
    report.skipped.push({ code, raw_code: rawCode, title, handle, reason: "already exists or batch duplicate" })
    console.log(`Skipped existing/duplicate ${code}: ${title}`)
    continue
  }

  const productTags = []
  for (const value of tagValues) productTags.push(await ensureTag(tagByValue, value))

  const files = []
  if (!dryRun) {
    for (const filePath of album.local_images.slice(0, 8)) {
      files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
    }
  }
  const imageUrls = files.map((file) => file.url)
  const payload = {
    title,
    subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
    handle,
    description: descriptionFor(info.name, info.colours, code),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: `YUP898556-${code}`,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [{ title: "Size", values: SIZES.map((size) => size.display_size) }],
    variants: SIZES.map((size) => ({
      title: size.display_size,
      sku: `MUSE-SHOXTL-YUP898556-${code}-${size.eu_size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
      allow_backorder: true,
      manage_inventory: false,
      weight: 400,
      options: { Size: size.display_size },
      prices: [
        { currency_code: "nzd", amount: PRICE },
        { currency_code: "usd", amount: PRICE },
        { currency_code: "eur", amount: PRICE },
      ],
      metadata: {
        ...size,
        size_system: "nike-jordan-us",
        source_size_system: "eu",
      },
    })),
    shipping_profile_id: IDS.shippingProfile,
    collection_id: IDS.collection,
    categories: [{ id: IDS.category }],
    type_id: IDS.productType,
    tags: productTags.map((tag) => ({ id: tag.id })),
    sales_channels: [{ id: IDS.salesChannel }],
    metadata: {
      source: "yupoo",
      source_url: album.source_url,
      source_title: album.source_title,
      source_category: SOURCE_CATEGORY,
      product_code: rawCode,
      corrected_product_code: code,
      brand: "Nike",
      model: "Nike Shox TL",
      source_size_system: "eu",
      display_size_system: "nike-jordan-us",
      size_display_note: "Sizes are shown as US Men's / US Women's.",
      colourway: info.name,
      full_colourway: info.colourway,
      colour_tags: info.colours.map((colour) => `colour:${colour}`).join(" | "),
      colour_confidence: info.confidence,
      colour_source: info.source,
    },
  }

  if (dryRun) {
    batchCodes.add(code)
    batchHandles.add(handle)
    reviewRows.push([
      rawCode,
      code,
      title,
      handle,
      info.colourway,
      info.colours.map((colour) => `colour:${colour}`).join(" | "),
      info.source,
      info.confidence,
      album.source_url,
      album.source_title,
      album.local_folder,
      album.local_images?.length || 0,
      "",
      handle,
      "dry_run_create",
      "",
    ])
    report.created.push({ code, raw_code: rawCode, title, handle, tags: tagValues, dry_run: true })
    console.log(`Would create ${code}: ${title} [${tagValues.join(", ")}]`)
    continue
  }

  const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,*images,*variants,*tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  batchCodes.add(code)
  batchHandles.add(handle)
  reviewRows.push([
    rawCode,
    code,
    title,
    handle,
    info.colourway,
    info.colours.map((colour) => `colour:${colour}`).join(" | "),
    info.source,
    info.confidence,
    album.source_url,
    album.source_title,
    album.local_folder,
    album.local_images?.length || 0,
    created.product?.id,
    created.product?.handle,
    "created",
    "",
  ])
  report.created.push({
    product_id: created.product?.id,
    external_id: created.product?.external_id,
    title: created.product?.title,
    handle: created.product?.handle,
    image_count: created.product?.images?.length,
    variant_count: created.product?.variants?.length,
    tags: tagValues,
    files,
  })
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Created ${code}: ${created.product?.id} ${title}`)
}

await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
