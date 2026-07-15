import fs from "node:fs/promises"
import path from "node:path"

const cliArgs = process.argv.slice(2)
const argValue = (name, fallback = "") => {
  const arg = cliArgs.find((value) => value.startsWith(`--${name}=`))
  return arg ? arg.slice(name.length + 3) : fallback
}

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = argValue("base-dir", "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-578923")
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, argValue("review-file", "new-balance-9060-enriched-review.csv"))
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const SOURCE_CATEGORY = argValue("source-category", "https://yolo66.x.yupoo.com/categories/578923?isSubCate=true")
const EXTERNAL_BATCH_ID = argValue("external-batch-id", "YUP578923")

const PRICE = 190
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

const COLOUR_HINTS = {
  黑色: ["black"],
  黑粉: ["black", "pink"],
  黑红: ["black", "red"],
  黑黄: ["black", "yellow"],
  黑银: ["black", "silver"],
  黑白: ["black", "white"],
  黑灰: ["black", "grey"],
  黑棕: ["black", "brown"],
  灰粽: ["grey", "brown"],
  灰棕: ["grey", "brown"],
  灰色: ["grey"],
  灰蓝: ["grey", "blue"],
  灰黑: ["grey", "black"],
  灰黄: ["grey", "yellow"],
  灰粉: ["grey", "pink"],
  灰绿: ["grey", "green"],
  灰红: ["grey", "red"],
  灰白: ["grey", "white"],
  深灰: ["grey"],
  棕色: ["brown"],
  浅棕: ["brown"],
  棕银: ["brown", "silver"],
  褐色: ["brown"],
  卡其: ["khaki"],
  深棕: ["brown"],
  白蓝: ["white", "blue"],
  白粉: ["white", "pink"],
  白灰: ["white", "grey"],
  白棕: ["white", "brown"],
  白黑: ["white", "black"],
  白色: ["white"],
  白绿: ["white", "green"],
  白紫: ["white", "purple"],
  白红: ["white", "red"],
  米白: ["cream"],
  米白黑: ["cream", "black"],
  米蓝: ["cream", "blue"],
  绿色: ["green"],
  深绿: ["green"],
  蓝色: ["blue"],
  l蓝色: ["blue"],
  蓝粉: ["blue", "pink"],
  蓝棕: ["blue", "brown"],
  蓝白: ["blue", "white"],
  红蓝: ["red", "blue"],
  深蓝: ["blue"],
  黄绿: ["yellow", "green"],
  黄色: ["yellow"],
  橙黄: ["orange", "yellow"],
  玫紫: ["pink", "purple"],
  紫色: ["purple"],
  绿紫: ["green", "purple"],
  绿粉: ["green", "pink"],
  红色: ["red"],
  彩色: ["multi"],
  黑紫: ["black", "purple"],
  黑绿: ["black", "green"],
  紫绿: ["purple", "green"],
  浅绿: ["green"],
  浅灰: ["grey"],
  浅粉: ["pink"],
  粉色: ["pink"],
  粉蓝: ["pink", "blue"],
  粉紫: ["pink", "purple"],
  紫红: ["purple", "red"],
}

const VERIFIED_COLOURWAYS = {
  U90608PE: {
    name: "Reflection White",
    full: "Reflection/White",
    colours: ["grey", "white"],
    source: "New Balance search result",
    confidence: "verified",
  },
  U9060JCG: {
    name: "Concrete",
    full: "Grey/Concrete",
    colours: ["grey"],
    source: "StockX",
    confidence: "verified",
  },
  U9060FGN: {
    name: "Grey",
    full: "Grey",
    colours: ["grey"],
    source: "Foot Locker/eBay search result",
    confidence: "verified",
  },
  U9060BPO: {
    name: "Blue Oasis Real Pink",
    full: "Blue Oasis/Real Pink",
    colours: ["blue", "pink"],
    source: "Flight Club",
    confidence: "verified",
  },
  U9060JGO: {
    name: "Dark Camo Sandstone",
    full: "Dark Camo/Dark Olive/Sandstone",
    colours: ["green", "brown"],
    source: "StockX/Hypeboost",
    confidence: "verified",
  },
  U9060FRL: {
    name: "Rose Pink",
    full: "Pink/White-Beige",
    colours: ["pink", "white", "beige"],
    source: "Flight Club/Nice Kicks",
    confidence: "verified",
  },
  U9060EEG: {
    name: "Driftwood Castlerock",
    full: "Driftwood/Mindful Grey/Castlerock",
    colours: ["brown", "grey"],
    source: "StockX",
    confidence: "verified",
  },
  U9060FOC: {
    name: "Green Grey",
    full: "Green/Grey",
    colours: ["green", "grey"],
    source: "StockX/GOAT",
    confidence: "verified",
  },
  U9060ESC: {
    name: "Magenta",
    full: "White/Pink/Purple",
    colours: ["white", "pink", "purple"],
    source: "StockX",
    confidence: "verified",
  },
  U9060EED: {
    name: "Chrome Blue",
    full: "Chrome Blue/Light Chrome Blue-Elemental Blue",
    colours: ["blue"],
    source: "StockX",
    confidence: "verified",
  },
  U9060JF: {
    name: "Festival Pack Beige White",
    full: "Beige/Off White/Clay",
    colours: ["beige", "white", "brown"],
    source: "KicksCrew/eBay search result",
    confidence: "verified",
  },
}

const args = new Set(cliArgs)
const dryRun = args.has("--dry-run")
const limitArg = [...args].find((arg) => arg.startsWith("--limit="))
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

const titleCase = (value) =>
  String(value)
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")

const parsePrice = (title) => {
  const match = String(title || "").match(/(\d{2,4})Y/)
  return match ? Number(match[1]) : PRICE
}

const parseRange = (title) => {
  const ranges = [...String(title || "").matchAll(/(\d{2}(?:\.\d)?)-(\d{2}(?:\.\d)?)/g)]
    .map((match) => ({ min: Number(match[1]), max: Number(match[2]) }))
    .filter(({ min, max }) => min >= 30 && min <= 50 && max >= 30 && max <= 50 && min <= max)

  if (!ranges.length) return REQUESTED_EU_SIZES
  const { min, max } = ranges[0]
  return REQUESTED_EU_SIZES.filter((size) => Number(size) >= min && Number(size) <= max)
}

const getChineseHint = (title) => {
  const matches = Object.keys(COLOUR_HINTS).filter((hint) => String(title).includes(hint))
  return matches.at(-1) || ""
}

const productInfoFor = (album) => {
  const verified = VERIFIED_COLOURWAYS[album.product_code]
  if (verified) return verified

  const hint = getChineseHint(album.source_title)
  const colours = hint ? COLOUR_HINTS[hint] : []
  const name = colours.length ? colours.map(titleCase).join(" ") : album.product_code
  const full = colours.length ? colours.map(titleCase).join("/") : album.product_code
  return {
    name,
    full,
    colours,
    source: hint ? `Yupoo title visible colour hint: ${hint}` : "Online source not verified; style code used transparently",
    confidence: hint ? "visible colour hint" : "needs review",
  }
}

const descriptionFor = (info, code) => {
  const colourText = info.colours.length ? `${info.colours.map(titleCase).join(", ").toLowerCase()} colour palette` : `style ${code}`
  return [
    `The New Balance 9060 ${info.name} brings the model's chunky 99X-inspired shape into a ${colourText}.`,
    "The upper mixes layered panels with a sculpted midsole, giving the 9060 its distinctive retro-future profile.",
    `Style ${code} is built for everyday wear, pairing easily with relaxed denim, cargos, wide-leg pants, and simple streetwear layers.`,
    "A cushioned underfoot feel, padded collar, and bold sole unit keep the sneaker comfortable while giving it strong visual presence.",
  ].join("\n\n")
}

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
    .flatMap((value) => [...String(value || "").matchAll(/\b(?:U|GC)9060[A-Z0-9]{1,4}\b/g)].map((match) => match[0]))
    .filter(Boolean)
}

const raw = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
const products = await listProducts()
const existingCodes = new Set(products.flatMap(productCodesFrom))
const existingHandles = new Set(products.map((product) => product.handle).filter(Boolean))
const tags = await listTags()
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const baseTags = ["new-balance", "new-balance-9060"]
for (const tag of baseTags) await ensureTag(tagByValue, tag)

const reviewRows = [[
  "product_code",
  "product_name",
  "url_slug",
  "source_eu_sizes",
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

const report = {
  started_at: new Date().toISOString(),
  dry_run: dryRun,
  backend_url: BACKEND_URL,
  source_category: SOURCE_CATEGORY,
  created: [],
  skipped: [],
  needs_review: [],
}
const seenCodes = new Set()
const seenHandles = new Set()
const jobs = []

for (const album of raw) {
  const code = album.product_code
  const sizes = parseRange(album.source_title)
  const info = productInfoFor(album)
  const title = `New Balance 9060 - ${info.name}`
  const handle = slugify(`new-balance-9060-${info.name === code ? code : `${info.name}-${code}`}`)
  const colourTags = info.colours.map((colour) => `colour:${colour}`)
  let status = dryRun ? "dry_run_create" : "create"
  let notes = ""

  if (!code) {
    status = "needs_review"
    notes = "No style code found; not imported."
  } else if (seenCodes.has(code) || seenHandles.has(handle)) {
    status = "skipped_duplicate_scrape"
    notes = "Duplicate style code/handle in the Yupoo category; first occurrence kept."
  } else if (existingCodes.has(code) || existingHandles.has(handle)) {
    status = "skipped_existing"
    notes = "Already present in Medusa by style code or handle; not duplicated."
  } else if (!sizes.length) {
    status = "needs_review"
    notes = "No requested EU sizes fit the source Yupoo size range; not imported."
  } else if ((album.local_images || []).length < 8) {
    status = "needs_review"
    notes = "Fewer than 8 local images; not imported."
  } else if (info.confidence === "needs review") {
    status = "needs_review"
    notes = "No verified online colourway or visible colour hint captured; not imported."
  } else if (info.confidence === "visible colour hint") {
    notes = "Colour based on Yupoo visible colour hint; review CSV keeps the source explicit."
  }

  reviewRows.push([
    code,
    title,
    handle,
    sizes.join(" | "),
    info.full,
    colourTags.join(" | "),
    info.source,
    info.confidence,
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
    jobs.push({ album, code, sizes, info, title, handle, colourTags, price: parsePrice(album.source_title) })
  } else {
    if (code) seenCodes.add(code)
    if (handle) seenHandles.add(handle)
    const bucket = status === "needs_review" ? report.needs_review : report.skipped
    bucket.push({ product_code: code, title, handle, status, notes })
  }
}

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Raw albums: ${raw.length}`)
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
    sku: `MUSE-NB9060-YUP578923-${job.code}-${euSize}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: true,
    manage_inventory: false,
    weight: 400,
    options: { Size: euSize },
    prices: [
      { currency_code: "nzd", amount: job.price },
      { currency_code: "usd", amount: job.price },
      { currency_code: "eur", amount: job.price },
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
    external_id: `${EXTERNAL_BATCH_ID}-${job.code}`,
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
      source_category: SOURCE_CATEGORY,
      product_code: job.code,
      corrected_product_code: job.code,
      brand: "New Balance",
      model: "New Balance 9060",
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
      price: job.price,
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
    price: job.price,
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
