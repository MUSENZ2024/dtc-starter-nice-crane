import fs from "node:fs/promises"
import path from "node:path"

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split("=")
      return [key, value.join("=") || "true"]
    })
)

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const SLUG = args.slug
const SOURCE_CATEGORY = args.categoryUrl
const SIZE_SET = args.sizes || "36-45"
const BASE_DIR = SLUG ? `/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/${SLUG}` : ""
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "gel-1130-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")

if (!SLUG || !SOURCE_CATEGORY) {
  throw new Error("Usage: node scripts/import-yupoo-gel-1130-to-medusa.mjs --slug=yupoo-category-608475 --categoryUrl=https://...")
}

const SIZE_SETS = {
  "36-45": ["36", "37", "37.5", "38", "39", "39.5", "40", "40.5", "41.5", "42", "42.5", "43.5", "44", "44.5", "45"],
  "36-46": ["36", "37", "37.5", "38", "39", "39.5", "40", "40.5", "41.5", "42", "42.5", "43.5", "44", "44.5", "45", "46", "46.5"],
}
const SIZES = SIZE_SETS[SIZE_SET] || SIZE_SETS["36-45"]
const PRICE = 160

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const CODE_CORRECTIONS = {
  "1201A256": "1201A256-105",
}

const COLOUR_HINTS = [
  [/白|white/i, "white"],
  [/黑|black|碳黑/i, "black"],
  [/银|silver/i, "silver"],
  [/灰|grey|gray|薄雾灰/i, "grey"],
  [/蓝|兰|blue|湖水蓝/i, "blue"],
  [/绿|green|墨绿/i, "green"],
  [/粉|pink/i, "pink"],
  [/红|red/i, "red"],
  [/黄|yellow/i, "yellow"],
  [/金|gold/i, "gold"],
  [/棕|brown/i, "brown"],
  [/米|beige/i, "beige"],
  [/珍珠|pearl/i, "cream"],
  [/玉|jade/i, "green"],
]

const PRODUCT_DATA = {
  "1201A256-002": { name: "Black", colours: ["black"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A255-002": { name: "Carbon Black", colours: ["black"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A255-004": { name: "Grey Black", colours: ["grey", "black"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A255-202": { name: "Green", colours: ["green"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A255-301": { name: "Green", colours: ["green"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-023": { name: "Grey Gold", colours: ["grey", "gold"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-025": { name: "Grey Black", colours: ["grey", "black"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-104": { name: "Pearl White", colours: ["cream", "white"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-111": { name: "White Yellow", colours: ["white", "yellow"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-113": { name: "White Silver Brown", colours: ["white", "silver", "brown"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-116": { name: "White Jade", colours: ["white", "green"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-118": { name: "Black Silver", colours: ["black", "silver"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-121": { name: "White Green", colours: ["white", "green"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A256-400": { name: "Deep Blue Silver Black", colours: ["blue", "silver", "black"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A906-001": { name: "Black Silver", colours: ["black", "silver"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A934-020": { name: "Dark Grey Silver", colours: ["grey", "silver"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A956-100": { name: "White Silver Black", colours: ["white", "silver", "black"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A956-101": { name: "White Blue", colours: ["white", "blue"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201A982-200": { name: "Brown", colours: ["brown"], confidence: "partial", source: "Yupoo title colour hint" },
  "1201B020-100": { name: "White Silver", colours: ["white", "silver"], confidence: "partial", source: "Yupoo title colour hint" },
  "1202A164-110": { name: "White Deep Blue", colours: ["white", "blue"], confidence: "partial", source: "Yupoo title colour hint" },
  "1202A164-116": { name: "Beige Silver Grey", colours: ["beige", "silver", "grey"], confidence: "partial", source: "Yupoo title colour hint" },
  "1202A507-100": { name: "White Pink", colours: ["white", "pink"], confidence: "partial", source: "Yupoo title colour hint" },
  "1202A515-400": { name: "Blue Pink", colours: ["blue", "pink"], confidence: "partial", source: "Yupoo title colour hint" },
  "1203A609-022": { name: "Grey Blue", colours: ["grey", "blue"], confidence: "partial", source: "Yupoo title colour hint" },
  "1203A609-103": { name: "White Blue", colours: ["white", "blue"], confidence: "partial", source: "Yupoo title colour hint" },
  "1203A610-300": { name: "White Green Black", colours: ["white", "green", "black"], confidence: "partial", source: "Yupoo title colour hint" },
  "1203A685-100": { name: "White Red", colours: ["white", "red"], confidence: "partial", source: "Yupoo title colour hint" },
  "1203A842-300": { name: "White Green", colours: ["white", "green"], confidence: "partial", source: "Yupoo title colour hint" },
  "1203A967-400": { name: "Black Blue", colours: ["black", "blue"], confidence: "partial", source: "Yupoo title colour hint" },
}

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const slugify = (value) =>
  value.toLowerCase().replace(/&/g, " and ").replace(/[().']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

const titleCase = (value) =>
  String(value).split(/[\s/-]+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")

const coloursFromTitle = (title) => {
  const colours = []
  for (const [pattern, colour] of COLOUR_HINTS) {
    if (pattern.test(title) && !colours.includes(colour)) colours.push(colour)
  }
  return colours
}

const descriptionFor = (name, colours, code) => {
  const colourText = colours.length ? colours.map(titleCase).join(", ").toLowerCase() : "sportstyle"
  return [
    `The ASICS GEL-1130 ${name} brings late-2000s running influence into an everyday sneaker with a ${colourText} palette.`,
    "The layered upper, ASICS side stripes, and GEL cushioning give the shoe its technical runner look while keeping it easy to wear day to day.",
    `Style ${code} works well with relaxed denim, cargos, and simple streetwear pieces for a clean retro sportstyle finish.`,
    "Lightweight cushioning and a supportive profile make the GEL-1130 a practical daily rotation option without losing its archive-inspired shape.",
  ].join("\n\n")
}

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

const uploadFile = async (filePath) => {
  const data = await fs.readFile(filePath)
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const form = new FormData()
      form.append("files", new File([data], path.basename(filePath), { type: "image/jpeg" }))
      const response = await fetch(`${BACKEND_URL}/admin/uploads`, { method: "POST", headers: authHeaders, body: form })
      const text = await response.text()
      let body
      try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
      if (!response.ok) throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
      return body.files[0]
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
    }
  }
  throw lastError
}

const listProducts = async () => {
  const products = []
  for (let offset = 0; offset < 4000; offset += 100) {
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
    const match = String(value || "").match(/\b(?:IQ\d{4}-\d{3}|\d{4}[A-Z]\d{3}-\d{3})\b/)
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
const baseTags = ["asics", "asics-gel-1130"]
for (const tag of baseTags) await ensureTag(tagByValue, tag)

const reviewRows = [[
  "product_code", "product_name", "url_slug", "colourway", "colour_tags", "colour_source", "colour_confidence", "source_url", "source_title", "local_folder", "local_image_count", "medusa_product_id", "medusa_handle", "import_status", "notes",
]]
const report = { started_at: new Date().toISOString(), dry_run: dryRun, created: [], skipped: [], needs_review: [] }

for (const album of raw) {
  const rawCode = album.product_code
  const code = CODE_CORRECTIONS[rawCode] || rawCode
  const fallbackColours = coloursFromTitle(album.source_title)
  const researched = PRODUCT_DATA[code]
  const info = researched || {
    name: fallbackColours.length ? fallbackColours.map(titleCase).join(" ") : code,
    colours: fallbackColours,
    confidence: fallbackColours.length ? "partial" : "needs review",
    source: fallbackColours.length ? "Yupoo title colour hint" : "not verified",
  }
  const displayName = info.name
  const title = `ASICS GEL-1130 - ${displayName}`
  const handleName = info.name === code ? code : `${info.name} ${code}`
  const handle = slugify(`asics-gel-1130-${handleName}`)
  const colours = info.colours || []
  const tagValues = [...baseTags, ...colours.map((colour) => `colour:${colour}`)]
  const existing = existingCodes.has(code) || existingHandles.has(handle)

  if (info.confidence === "needs review") {
    report.needs_review.push({ code, raw_code: rawCode, source_title: album.source_title, reason: "colourway not verified; product title includes style code" })
  }

  const reviewCode = rawCode === code ? code : `${rawCode} -> ${code}`
  if (existing) {
    reviewRows.push([reviewCode, title, handle, info.name, colours.map((colour) => `colour:${colour}`).join(" | "), info.source, info.confidence, album.source_url, album.source_title, album.local_folder, album.local_images?.length || 0, "", handle, "skipped_existing", "Already present in Medusa; not duplicated or replaced."])
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
    description: descriptionFor(displayName, colours, code),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: `YUP${SLUG.replace("yupoo-category-", "")}-${code}`,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [{ title: "Size", values: SIZES }],
    variants: SIZES.map((size) => ({
      title: size,
      sku: `MUSE-GEL1130-YUP${SLUG.replace("yupoo-category-", "")}-${code}-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
      model: "ASICS GEL-1130",
      colourway: info.name,
      colour_tags: colours.map((colour) => `colour:${colour}`).join(" | "),
      colour_confidence: info.confidence,
      colour_source: info.source,
    },
  }

  if (dryRun) {
    reviewRows.push([reviewCode, title, handle, info.name, colours.map((colour) => `colour:${colour}`).join(" | "), info.source, info.confidence, album.source_url, album.source_title, album.local_folder, album.local_images?.length || 0, "", handle, "dry_run_create", info.confidence === "needs review" ? "Colourway not verified; title uses product code." : ""])
    report.created.push({ code, title, handle, variant_count: SIZES.length, tags: tagValues, dry_run: true })
    console.log(`Would create ${code}: ${title} [${tagValues.join(", ")}]`)
    continue
  }

  const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,*images,*variants,*tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  reviewRows.push([reviewCode, title, handle, info.name, colours.map((colour) => `colour:${colour}`).join(" | "), info.source, info.confidence, album.source_url, album.source_title, album.local_folder, album.local_images?.length || 0, created.product?.id, created.product?.handle, "created", info.confidence === "needs review" ? "Colourway not verified; title uses product code." : ""])
  report.created.push({ product_id: created.product?.id, external_id: created.product?.external_id, title: created.product?.title, handle: created.product?.handle, image_count: created.product?.images?.length, variant_count: created.product?.variants?.length, tags: tagValues, files })
  existingCodes.add(code)
  existingHandles.add(handle)
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Created ${code}: ${created.product?.id} ${title}`)
}

await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
