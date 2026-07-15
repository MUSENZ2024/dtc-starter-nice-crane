import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-580043"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "miu-miu-new-balance-530-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const SOURCE_CATEGORY = "https://yolo66.x.yupoo.com/categories/580043?isSubCate=true"
const PRICE = 180

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const EU_SIZES = [
  "35",
  "35.5",
  "36",
  "36.5",
  "37",
  "37.5",
  "38",
  "38.5",
  "39",
  "39.5",
  "40",
  "40.5",
  "41",
  "41.5",
  "42",
  "42.5",
  "43",
  "43.5",
  "44",
]

const PRODUCT_DATA = [
  {
    match: "卡其网",
    name: "Khaki Mesh",
    full: "Khaki/Mesh",
    colours: ["khaki", "beige"],
    source: "Yupoo visible colour hint; official Miu Miu collection confirms New Balance X Miu Miu 530 SL suede and mesh line",
    confidence: "visible colour hint",
  },
  {
    match: "粉色",
    name: "Pink",
    full: "Pink",
    colours: ["pink"],
    source: "Yupoo visible colour hint; official Miu Miu collection lists pink in the New Balance X Miu Miu range",
    confidence: "visible colour hint",
  },
  {
    match: "灰白色",
    name: "Grey White",
    full: "Grey/White",
    colours: ["grey", "white"],
    source: "Yupoo visible colour hint",
    confidence: "visible colour hint",
  },
  {
    match: "白色",
    name: "White Suede And Mesh",
    full: "White",
    colours: ["white"],
    source: "Official Miu Miu New Balance X Miu Miu 530 SL suede and mesh sneakers - White",
    confidence: "verified",
  },
  {
    match: "新银色",
    name: "Silver",
    full: "Silver",
    colours: ["silver"],
    source: "Official Miu Miu New Balance X Miu Miu 530 SL silver/metallic range",
    confidence: "verified",
  },
  {
    match: "卡其色",
    name: "Khaki",
    full: "Khaki",
    colours: ["khaki", "beige"],
    source: "Yupoo visible colour hint",
    confidence: "visible colour hint",
  },
  {
    match: "棕色",
    name: "Cinnamon",
    full: "Cinnamon/Brown",
    colours: ["brown"],
    source: "Official Miu Miu New Balance X Miu Miu 530 SL suede sneakers - Cinnamon",
    confidence: "verified",
  },
  {
    match: "白皮",
    name: "White Leather",
    full: "White leather",
    colours: ["white"],
    source: "Official Miu Miu New Balance X Miu Miu 530 SL leather sneakers - White",
    confidence: "verified",
  },
]

const SKIP_TITLE_PATTERNS = [/Miu Miu x 530.*35-40.*银色/, /Miu Miu x 530.*【35-40】.*银色/]

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
  if (!match) return EU_SIZES
  const min = Number(match[1])
  const max = Number(match[2])
  return EU_SIZES.filter((size) => Number(size) >= min && Number(size) <= max)
}

const infoFor = (title) => PRODUCT_DATA.find((item) => String(title).includes(item.match))

const descriptionFor = (info) =>
  [
    `The New Balance X Miu Miu 530 SL ${info.name} brings Miu Miu's runway interpretation to New Balance's 530 runner shape.`,
    "The collaboration reworks the silhouette with a slimmer, fashion-led profile while keeping the familiar low runner structure easy to wear.",
    `This ${info.full.toLowerCase()} edition pairs well with relaxed denim, tonal tailoring, skirts, and everyday streetwear layers.`,
    "A lightweight upper, cushioned sole, and low-profile shape make it a refined everyday sneaker with strong designer-collaboration appeal.",
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

const raw = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
const products = await listProducts()
const existingHandles = new Set(products.map((product) => product.handle).filter(Boolean))
const existingSourceUrls = new Set(products.map((product) => product.metadata?.source_url).filter(Boolean))
const tags = await listTags()
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const baseTags = ["new-balance", "new-balance-530", "miu-miu", "miu-miu-new-balance-530"]
for (const tag of baseTags) await ensureTag(tagByValue, tag)

const reviewRows = [[
  "product_key",
  "product_name",
  "url_slug",
  "source_eu_sizes",
  "price",
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
  price: PRICE,
  created: [],
  skipped: [],
  needs_review: [],
}

const jobs = []
const seenHandles = new Set()
for (const album of raw) {
  const sourceTitle = album.source_title || ""
  const shouldSkip = SKIP_TITLE_PATTERNS.some((pattern) => pattern.test(sourceTitle))
  const info = infoFor(sourceTitle)
  const key = info ? slugify(info.name) : slugify(`album-${album.index + 1}`)
  const title = info ? `New Balance X Miu Miu 530 SL - ${info.name}` : ""
  const handle = info ? slugify(`new-balance-miu-miu-530-sl-${info.name}`) : ""
  const sizes = parseRange(sourceTitle)
  const colourTags = info ? info.colours.map((colour) => `colour:${colour}`) : []
  let status = dryRun ? "dry_run_create" : "create"
  let notes = ""

  if (shouldSkip) {
    status = "skipped_user"
    notes = "Skipped per user request: Miu Miu x 530 35-40 silver."
  } else if (!info) {
    status = "needs_review"
    notes = "No colour mapping captured for this source title; not imported."
  } else if (existingHandles.has(handle) || existingSourceUrls.has(album.source_url) || seenHandles.has(handle)) {
    status = "skipped_existing"
    notes = "Already present in Medusa or duplicated within this scrape; not duplicated."
  } else if (!sizes.length) {
    status = "needs_review"
    notes = "No EU sizes fit the source range; not imported."
  } else if ((album.local_images || []).length < 8) {
    status = "needs_review"
    notes = "Fewer than 8 local images; not imported."
  }

  reviewRows.push([
    key,
    title,
    handle,
    sizes.join(" | "),
    PRICE,
    info?.full || "",
    colourTags.join(" | "),
    info?.source || "",
    info?.confidence || "",
    album.source_url,
    sourceTitle,
    album.local_folder,
    album.local_images?.length || 0,
    "",
    handle,
    status,
    notes,
  ])

  if (status === "create" || status === "dry_run_create") {
    seenHandles.add(handle)
    jobs.push({ album, info, key, title, handle, sizes, colourTags })
  } else {
    const bucket = status === "needs_review" ? report.needs_review : report.skipped
    bucket.push({ key, title, handle, status, notes, source_title: sourceTitle })
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
    sku: `MUSE-MIUMIU530-YUP580043-${job.key}-${euSize}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
    description: descriptionFor(job.info),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: `YUP580043-${job.key}`,
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
      product_key: job.key,
      brand: "New Balance",
      collaboration: "Miu Miu",
      model: "New Balance X Miu Miu 530 SL",
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
      product_key: job.key,
      title: job.title,
      handle: job.handle,
      variant_count: variants.length,
      eu_sizes: job.sizes,
      tags: tagValues,
      price: PRICE,
      dry_run: true,
    })
    console.log(`Would create ${index}/${Math.min(jobs.length, limit)}: ${job.key} variants=${variants.length}`)
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
  console.log(`Created ${index}/${Math.min(jobs.length, limit)}: ${job.key} ${created.product?.id}`)
}

await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
