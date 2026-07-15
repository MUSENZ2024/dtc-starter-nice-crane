import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ROOT_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports"
const OUT_DIR = path.join(ROOT_DIR, "yupoo-nb530-808295-543289-528930")
const REVIEW_PATH = path.join(OUT_DIR, "new-balance-530-enriched-review.csv")
const REPORT_PATH = path.join(OUT_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const PRICE = 150

const BATCHES = [
  {
    slug: "yupoo-category-528930",
    sourceCategory: "https://yolo66.x.yupoo.com/categories/528930?isSubCate=true",
    priority: 1,
  },
  {
    slug: "yupoo-category-808295",
    sourceCategory: "https://yolo66.x.yupoo.com/categories/808295?isSubCate=true",
    priority: 2,
  },
  {
    slug: "yupoo-category-543289",
    sourceCategory: "https://yolo66.x.yupoo.com/categories/543289?isSubCate=true",
    priority: 3,
  },
]

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const REQUESTED_EU_SIZES = [
  "36",
  "37",
  "37.5",
  "38",
  "38.5",
  "39.5",
  "40",
  "40.5",
  "41.5",
  "42",
  "42.5",
  "43",
  "44",
  "45",
  "46.5",
  "47.5",
]

const TG_SKIP_CODES = new Set([
  "MR530SGC",
  "MR530CF",
  "MR530PK",
  "MR53OUNI",
  "MR530AA",
  "MR530FW1",
  "MR53OEWB",
  "MR530FB1",
  "MR530TG",
  "MR530VS",
  "MR530SX",
  "MR530AB",
  "MR530CB",
  "MR530LG",
  "MR530USX",
  "MR530SD",
  "MR530KOB",
  "MR53OKWM",
  "MR53ONI",
  "MR530SH",
  "MR530KA",
  "MR530AD",
  "MR530KC",
  "MR530SG",
  "MR530AA1",
  "MR530SNC",
  "MR530SZ",
])

const CHINESE_COLOURS = {
  幻影黑: { name: "Phantom Black", full: "Black/Silver", colours: ["black", "silver"] },
  浅灰兰米白: { name: "Light Grey Blue Cream", full: "Light Grey/Blue/Cream", colours: ["grey", "blue", "cream"] },
  白银: { name: "White Silver", full: "White/Silver", colours: ["white", "silver"] },
  浅奶茶色: { name: "Moonbeam Sea Salt", full: "Moonbeam/Sea Salt", colours: ["beige", "cream"] },
  浅灰色: { name: "Light Grey", full: "Light Grey", colours: ["grey"] },
  灰银: { name: "Grey Silver", full: "Grey/Silver", colours: ["grey", "silver"] },
  白棕: { name: "White Brown", full: "White/Brown", colours: ["white", "brown"] },
}

const PRODUCT_DATA = {
  MR530FB1: { name: "Black Silver", full: "Black/Silver", colours: ["black", "silver"], source: "KicksCrew", confidence: "verified" },
  MR530KC: { name: "Steel Blue", full: "Steel Blue/Grey/White/Blue", colours: ["blue", "grey", "white"], source: "KicksCrew/YouTube result", confidence: "verified" },
  MR530SG: { name: "White Silver Navy", full: "White/Silver/Navy", colours: ["white", "silver", "blue"], source: "Flight Club/eBay result", confidence: "verified" },
  MR530AA1: { name: "Moonbeam", full: "Moonbeam/Sea Salt", colours: ["beige", "cream"], source: "StockX", confidence: "verified" },
  MR530KMW: { name: "Light Grey", full: "Light Grey", colours: ["grey"], source: "Yupoo visible colour hint", confidence: "visible colour hint" },
  MR530KA: { name: "Steel Grey", full: "Steel Grey/Silver/White/Navy", colours: ["grey", "silver", "white", "blue"], source: "StockX", confidence: "verified" },
  MR530NI: { name: "White Brown", full: "White/Brown", colours: ["white", "brown"], source: "Yupoo visible colour hint", confidence: "visible colour hint" },
  MR530LG: { name: "Light Grey", full: "Light Grey/White", colours: ["grey", "white"], source: "online search attempted; colour inferred from style suffix and product imagery", confidence: "needs review" },
  MR530EWB: { name: "White Black Details", full: "White/Black", colours: ["white", "black"], source: "PRM", confidence: "verified" },
  MR530CC1: { name: "White Green", full: "White/Green", colours: ["white", "green"], source: "KicksCrew/Reversible", confidence: "verified" },
  MR530FW1: { name: "White Silver Metallic", full: "White/Silver Metallic", colours: ["white", "silver"], source: "GOAT/Flight Club", confidence: "verified" },
  MR530BC: { name: "White Raspberry", full: "White/Raspberry/Brighton Grey", colours: ["white", "pink", "grey"], source: "Flight Club", confidence: "verified" },
  MR530CK: { name: "White Silver", full: "White/Silver", colours: ["white", "silver"], source: "online search attempted; colour inferred from product imagery", confidence: "needs review" },
  MR530SH: { name: "Ivory", full: "Ivory/White/Black", colours: ["cream", "white", "black"], source: "StockX", confidence: "verified" },
  MR530SD: { name: "White Silver", full: "White/Silver", colours: ["white", "silver"], source: "online search attempted; colour inferred from product imagery", confidence: "needs review" },
  MR530AD: { name: "White Silver Metallic", full: "White/Silver Metallic", colours: ["white", "silver"], source: "StockX", confidence: "verified" },
  MR530ENG: { name: "White Nightwatch Green", full: "White/Nightwatch Green", colours: ["white", "green"], source: "YouTube/eBay result", confidence: "verified" },
  U530SUB: { name: "Rain Cloud Castlerock", full: "Rain Cloud/Castlerock", colours: ["grey"], source: "SNIPES/Solestop result", confidence: "verified" },
  MR530CL: { name: "Rich Earth", full: "Rich Earth", colours: ["brown"], source: "eBay result", confidence: "verified" },
  U530VI: { name: "Light Blue", full: "Light Blue/White", colours: ["blue", "white"], source: "online search attempted; colour inferred from product imagery", confidence: "needs review" },
  MR530MR: { name: "Moonbeam Raw Cashew", full: "Moonbeam/Raw Cashew/Raincloud", colours: ["cream", "beige", "grey"], source: "Flight Club", confidence: "verified" },
  U53022Q: { name: "Silver Rosewood", full: "Silver Metallic/Rosewood", colours: ["silver", "pink"], source: "Amazon/PRM result", confidence: "verified" },
  MR530JF: { name: "Festivals", full: "Cream/Pink-Red", colours: ["cream", "pink", "red"], source: "Nice Kicks/Farfetch", confidence: "verified" },
  MR530TA: { name: "Silver Cream", full: "Silver/Cream", colours: ["silver", "cream"], source: "StockX", confidence: "verified" },
  U530CSB: { name: "Arid Stone", full: "Arid Stone/Sea Salt", colours: ["beige", "cream"], source: "StockX", confidence: "verified" },
  U530TBD: { name: "Turtledove Angora Mushroom", full: "Turtledove/Angora/Mushroom", colours: ["beige", "grey", "brown"], source: "New Balance colour family result", confidence: "needs review" },
  U530SUA: { name: "Bisque Earth Shadow", full: "Bisque/Earth Shadow", colours: ["brown", "beige"], source: "SNIPES/Shiekh", confidence: "verified" },
  GR530EC: { name: "White Natural Indigo Silver Metallic", full: "NB White/Natural Indigo/Silver Metallic", colours: ["white", "blue", "silver"], source: "New Balance kids 530 Lace result", confidence: "needs review" },
  MR530ECP: { name: "White Silver", full: "White/Silver", colours: ["white", "silver"], source: "online search attempted; colour inferred from product imagery", confidence: "needs review" },
  MR530QA: { name: "White Grey", full: "White/Grey", colours: ["white", "grey"], source: "online search attempted; colour inferred from product imagery", confidence: "needs review" },
}

const dryRun = process.argv.includes("--dry-run")
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity

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

const parseRange = (title) => {
  const match = String(title || "").match(/(\d{2}(?:\.\d)?)-(\d{2}(?:\.\d)?)/)
  if (!match) return REQUESTED_EU_SIZES
  const min = Number(match[1])
  const max = Number(match[2])
  return REQUESTED_EU_SIZES.filter((size) => Number(size) >= min && Number(size) <= max)
}

const isTgBatch = (title) => /TG Batch/i.test(String(title || ""))

const titleCase = (value) =>
  String(value)
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")

const infoFor = (album) => {
  const code = album.product_code
  const mapped = PRODUCT_DATA[code]
  if (mapped) return mapped
  const hint = Object.entries(CHINESE_COLOURS).find(([text]) => album.source_title.includes(text))?.[1]
  if (hint) {
    return {
      ...hint,
      source: "Yupoo visible colour hint",
      confidence: "visible colour hint",
    }
  }
  return {
    name: code,
    full: code,
    colours: [],
    source: "Online source not verified; style code used transparently",
    confidence: "needs review",
  }
}

const descriptionFor = (info, code) =>
  [
    `The New Balance 530 ${info.name} brings the model's retro running shape into a ${info.full.toLowerCase()} colourway.`,
    "The 530 uses a breathable mesh base, synthetic overlays, and ABZORB cushioning for the familiar early-2000s running feel.",
    `Style ${code} works as an easy everyday sneaker, pairing cleanly with denim, cargos, relaxed pants, and simple streetwear layers.`,
    "A lightweight upper, cushioned sole, and low-profile collar keep the pair comfortable for daily wear without losing the classic New Balance runner look.",
  ].join("\n\n")

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

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
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
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
  const values = [
    product.external_id,
    product.metadata?.product_code,
    product.metadata?.corrected_product_code,
    product.metadata?.style_code,
    product.title,
    product.handle,
  ]
  return values
    .flatMap((value) => [...String(value || "").matchAll(/\b(?:MR|U|GR)530[A-Z0-9]{1,4}\b|\bMR53O[A-Z0-9]{2,4}\b/g)].map((match) => match[0]))
    .filter(Boolean)
}

await fs.mkdir(OUT_DIR, { recursive: true })
const rawAlbums = []
for (const batch of BATCHES) {
  const rawPath = path.join(ROOT_DIR, batch.slug, "raw-albums.json")
  const albums = JSON.parse(await fs.readFile(rawPath, "utf8"))
  rawAlbums.push(...albums.map((album) => ({ ...album, batch })))
}
rawAlbums.sort((a, b) => a.batch.priority - b.batch.priority || a.index - b.index)

const products = await listProducts()
const existingCodes = new Set(products.flatMap(productCodesFrom))
const existingHandles = new Set(products.map((product) => product.handle).filter(Boolean))
const tags = await listTags()
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const baseTags = ["new-balance", "new-balance-530"]
for (const tag of baseTags) await ensureTag(tagByValue, tag)

const reviewRows = [[
  "product_code",
  "product_name",
  "url_slug",
  "source_eu_sizes",
  "price",
  "colourway",
  "colour_tags",
  "colour_source",
  "colour_confidence",
  "source_category",
  "source_url",
  "source_title",
  "local_folder",
  "local_image_count",
  "medusa_product_id",
  "medusa_handle",
  "import_status",
  "notes",
]]

const report = {
  started_at: new Date().toISOString(),
  dry_run: dryRun,
  backend_url: BACKEND_URL,
  price: PRICE,
  created: [],
  skipped: [],
  needs_review: [],
}

const jobs = []
const seenCodes = new Set()
const seenHandles = new Set()
for (const album of rawAlbums) {
  const code = album.product_code
  const info = infoFor(album)
  const handle = slugify(`new-balance-530-${info.name}-${code}`)
  const title = `New Balance 530 - ${info.name}`
  const sizes = parseRange(album.source_title)
  const colourTags = info.colours.map((colour) => `colour:${colour}`)
  let status = dryRun ? "dry_run_create" : "create"
  let notes = ""

  if (isTgBatch(album.source_title) && TG_SKIP_CODES.has(code)) {
    status = "skipped_user"
    notes = "Skipped per user TG Batch do-not-upload list."
  } else if (seenCodes.has(code) || seenHandles.has(handle)) {
    status = "skipped_duplicate_scrape"
    notes = "Duplicate style code in requested Yupoo categories; first selected source kept."
  } else if (existingCodes.has(code) || existingHandles.has(handle)) {
    status = "skipped_existing"
    notes = "Already present in Medusa by style code or handle; not duplicated."
  } else if (!sizes.length) {
    status = "needs_review"
    notes = "No requested EU sizes fit the source range; not imported."
  } else if ((album.local_images || []).length < 8) {
    status = "needs_review"
    notes = "Fewer than 8 local images; not imported."
  }

  reviewRows.push([
    code,
    title,
    handle,
    sizes.join(" | "),
    PRICE,
    info.full,
    colourTags.join(" | "),
    info.source,
    info.confidence,
    album.batch.sourceCategory,
    album.source_url,
    album.source_title,
    album.local_folder,
    album.local_images?.length || 0,
    "",
    handle,
    status,
    notes,
  ])

  if (status === "create" || status === "dry_run_create") {
    seenCodes.add(code)
    seenHandles.add(handle)
    jobs.push({ album, code, info, handle, title, sizes, colourTags })
  } else {
    if (code) seenCodes.add(code)
    if (handle) seenHandles.add(handle)
    const bucket = status === "needs_review" ? report.needs_review : report.skipped
    bucket.push({ product_code: code, title, handle, status, notes, source_title: album.source_title })
  }
}

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Raw albums: ${rawAlbums.length}`)
console.log(`Jobs to create: ${jobs.length}`)
console.log(`Skipped: ${report.skipped.length}`)
console.log(`Needs review: ${report.needs_review.length}`)

let index = 0
for (const job of jobs.slice(0, limit)) {
  index += 1
  const tagValues = [...baseTags, ...job.colourTags]
  const productTags = []
  for (const value of tagValues) productTags.push(await ensureTag(tagByValue, value))

  const files = []
  if (!dryRun) {
    for (const filePath of job.album.local_images.slice(0, 8)) {
      files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
    }
  }
  const imageUrls = files.map((file) => file.url)
  const variants = job.sizes.map((euSize) => ({
    title: euSize,
    sku: `MUSE-NB530-YUPMULTI-${job.code}-${euSize}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: true,
    manage_inventory: false,
    weight: 400,
    options: { Size: euSize },
    prices: [
      { currency_code: "nzd", amount: PRICE },
      { currency_code: "usd", amount: PRICE },
      { currency_code: "eur", amount: PRICE },
    ],
    metadata: {
      eu_size: euSize,
      display_size: euSize,
      size_system: "eu",
      source_size_system: "eu",
    },
  }))

  const payload = {
    title: job.title,
    subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
    handle: job.handle,
    description: descriptionFor(job.info, job.code),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: `YUPNB530-${job.code}`,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [{ title: "Size", values: job.sizes }],
    variants,
    shipping_profile_id: IDS.shippingProfile,
    collection_id: IDS.collection,
    categories: [{ id: IDS.category }],
    type_id: IDS.productType,
    tags: productTags.map((tag) => ({ id: tag.id })),
    sales_channels: [{ id: IDS.salesChannel }],
    metadata: {
      source: "yupoo",
      source_url: job.album.source_url,
      source_title: job.album.source_title,
      source_category: job.album.batch.sourceCategory,
      product_code: job.code,
      corrected_product_code: job.code,
      brand: "New Balance",
      model: "New Balance 530",
      source_size_system: "eu",
      display_size_system: "eu",
      size_display_note: "Sizes are shown as EU buttons.",
      colourway: job.info.name,
      full_colourway: job.info.full,
      colour_tags: job.colourTags.join(" | "),
      colour_confidence: job.info.confidence,
      colour_source: job.info.source,
      source_eu_sizes: job.sizes.join(" | "),
    },
  }

  if (dryRun) {
    report.created.push({
      product_code: job.code,
      title: job.title,
      handle: job.handle,
      variant_count: variants.length,
      eu_sizes: job.sizes,
      tags: tagValues,
      price: PRICE,
      dry_run: true,
    })
    console.log(`Would create ${index}/${Math.min(jobs.length, limit)}: ${job.code} variants=${variants.length}`)
    continue
  }

  const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,*images,*variants,*tags,metadata", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  report.created.push({
    product_id: created.product?.id,
    external_id: created.product?.external_id,
    title: created.product?.title,
    handle: created.product?.handle,
    image_count: created.product?.images?.length,
    variant_count: created.product?.variants?.length,
    eu_sizes: job.sizes,
    tags: tagValues,
    price: PRICE,
    files,
  })
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Created ${index}/${Math.min(jobs.length, limit)}: ${job.code} ${created.product?.id}`)
}

await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
