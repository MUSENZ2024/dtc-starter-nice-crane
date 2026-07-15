import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-733964"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "gel-nyc-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const SOURCE_CATEGORY = "https://yolo88.x.yupoo.com/categories/733964?isSubCate=true"

const SIZES = ["36", "37", "37.5", "38", "39", "39.5", "40", "40.5", "41.5", "42", "42.5", "43.5", "44", "44.5", "45"]
const PRICE = 160

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const PRODUCT_DATA = {
  "1203A739-100": { name: "Cream Cream", colourway: "Cream/Cream", colours: ["cream"], confidence: "partial", source: "community / marketplace results" },
  "1203A739-401": { name: "Storm Cloud Pure Silver", colourway: "Storm Cloud/Pure Silver", colours: ["grey", "silver"], confidence: "verified", source: "ASICS / StockX" },
  "1203A383-113": { name: "Cream White", colourway: "Cream/White", colours: ["cream", "white"], confidence: "verified", source: "ASICS" },
  "1203A739-400": { name: "Dolphin Grey Fjord Grey", colourway: "Dolphin Grey/Fjord Grey", colours: ["grey", "blue"], confidence: "verified", source: "Hypebeast / retailer results" },
  "1203A383-201": { name: "Brown Storm Black Coffee", colourway: "Brown Storm/Black Coffee", colours: ["brown", "black"], confidence: "verified", source: "ASICS" },
  "1203A739-251": { name: "Mineral Beige", colourway: "Mineral Beige/Mineral Beige", colours: ["beige", "brown"], confidence: "verified", source: "ASICS / Sneakerjagers" },
  "1203A383-025": { name: "Glacier Grey Gravel", colourway: "Glacier Grey/Gravel", colours: ["grey"], confidence: "verified", source: "Flight Club / Sneakerjagers" },
  "1203A372-600": { name: "Ivory Mid Grey", colourway: "Ivory/Mid Grey", colours: ["cream", "grey"], confidence: "verified", source: "StockX" },
  "1201A789-020": { name: "Graphite Grey Black", colourway: "Graphite Grey/Black", colours: ["grey", "black"], confidence: "verified", source: "StockX / ASICS" },
  "1203A383-020": { name: "Oatmeal Concrete", colourway: "Oatmeal/Concrete", colours: ["beige", "grey"], confidence: "verified", source: "Nice Kicks" },
  "1201A789-103": { name: "Cream Oyster Grey", colourway: "Cream/Oyster Grey", colours: ["cream", "grey"], confidence: "partial", source: "community / marketplace results" },
}

const CODE_CORRECTIONS = {
  "1203A739": "1203A739-100",
  "120A280-100": "1203A280-100",
  "1203383-200": "1203A383-200",
  "123A372-600": "1203A372-600",
  "123A383-002": "1203A383-002",
}

const COLOUR_WORDS = {
  beige: "beige",
  black: "black",
  blue: "blue",
  brown: "brown",
  cement: "grey",
  coffee: "brown",
  concrete: "grey",
  cream: "cream",
  dolphin: "grey",
  fjord: "blue",
  glacier: "grey",
  graphite: "grey",
  gravel: "grey",
  grey: "grey",
  ivory: "cream",
  mineral: "beige",
  oatmeal: "beige",
  oyster: "grey",
  silver: "silver",
  storm: "grey",
  white: "white",
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

const coloursFor = (info) => {
  const colours = []
  for (const colour of info.colours || []) {
    if (!colours.includes(colour)) colours.push(colour)
  }
  for (const word of `${info.name} ${info.colourway}`.toLowerCase().split(/[^a-z]+/)) {
    const colour = COLOUR_WORDS[word]
    if (colour && !colours.includes(colour)) colours.push(colour)
  }
  return colours
}

const titleCase = (value) =>
  String(value)
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")

const descriptionFor = (name, colours, code) => {
  const colourText = colours.length ? colours.map(titleCase).join(", ").toLowerCase() : "neutral sportstyle"
  return [
    `The ASICS GEL-NYC ${name} brings early-2000s running influence into a layered everyday sneaker with a ${colourText} palette.`,
    "The silhouette references ASICS heritage runners through its mixed-panel upper, signature side stripes, and technical GEL cushioning underfoot.",
    `Style ${code} keeps the GEL-NYC's retro shape easy to wear, with a balanced profile that works with relaxed denim, cargos, or simple streetwear layers.`,
    "Lightweight cushioning, a flexible sole, and a supportive upper make it a practical daily option while keeping the distinctive ASICS sportstyle look.",
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
  for (let offset = 0; offset < 3000; offset += 100) {
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
    const match = String(value || "").match(/\b\d{4}[A-Z]\d{3}-\d{3}\b/)
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
const baseTags = ["asics", "asics-gel-nyc"]
for (const tag of baseTags) await ensureTag(tagByValue, tag)

const reviewRows = [[
  "product_code",
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

for (const album of raw) {
  const rawCode = album.product_code
  const code = CODE_CORRECTIONS[rawCode] || rawCode
  const researched = PRODUCT_DATA[code]
  const info = researched || { name: code, colourway: "", colours: [], confidence: "needs review", source: "not verified" }
  const title = `ASICS GEL-NYC - ${info.name}`
  const handle = slugify(`asics-gel-nyc-${info.name}`)
  const colours = coloursFor(info)
  const tagValues = [...baseTags, ...colours.map((colour) => `colour:${colour}`)]
  const existing = existingCodes.has(code) || existingHandles.has(handle)

  if (info.confidence === "needs review") {
    report.needs_review.push({ code, raw_code: rawCode, source_title: album.source_title, reason: "colourway not verified; product title uses style code" })
  }

  if (existing) {
    reviewRows.push([
      rawCode === code ? code : `${rawCode} -> ${code}`,
      title,
      handle,
      info.colourway,
      colours.map((colour) => `colour:${colour}`).join(" | "),
      info.source,
      info.confidence,
      album.source_url,
      album.source_title,
      album.local_folder,
      album.local_images?.length || 0,
      "",
      handle,
      "skipped_existing",
      "Already present in Medusa; not duplicated or replaced.",
    ])
    report.skipped.push({ code, raw_code: rawCode, title, handle, reason: "already exists" })
    console.log(`Skipped existing ${code}: ${title}`)
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
    description: descriptionFor(info.name, colours, code),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: `YUP733964-${code}`,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [{ title: "Size", values: SIZES }],
    variants: SIZES.map((size) => ({
      title: size,
      sku: `MUSE-GELNYC-YUP733964-${code}-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
      allow_backorder: true,
      manage_inventory: false,
      weight: 400,
      options: { Size: size },
      prices: [
        { currency_code: "nzd", amount: PRICE },
        { currency_code: "usd", amount: PRICE },
        { currency_code: "eur", amount: PRICE },
      ],
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
      model: "ASICS GEL-NYC",
      colourway: info.name,
      full_colourway: info.colourway,
      colour_tags: colours.map((colour) => `colour:${colour}`).join(" | "),
      colour_confidence: info.confidence,
      colour_source: info.source,
    },
  }

  if (dryRun) {
    reviewRows.push([
      rawCode === code ? code : `${rawCode} -> ${code}`,
      title,
      handle,
      info.colourway,
      colours.map((colour) => `colour:${colour}`).join(" | "),
      info.source,
      info.confidence,
      album.source_url,
      album.source_title,
      album.local_folder,
      album.local_images?.length || 0,
      "",
      handle,
      "dry_run_create",
      info.confidence === "needs review" ? "Colourway not verified; title uses product code." : "",
    ])
    report.created.push({ code, title, handle, tags: tagValues, dry_run: true })
    console.log(`Would create ${code}: ${title} [${tagValues.join(", ")}]`)
    continue
  }

  const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,*images,*variants,*tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  reviewRows.push([
    rawCode === code ? code : `${rawCode} -> ${code}`,
    title,
    handle,
    info.colourway,
    colours.map((colour) => `colour:${colour}`).join(" | "),
    info.source,
    info.confidence,
    album.source_url,
    album.source_title,
    album.local_folder,
    album.local_images?.length || 0,
    created.product?.id,
    created.product?.handle,
    "created",
    info.confidence === "needs review" ? "Colourway not verified; title uses product code." : "",
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
