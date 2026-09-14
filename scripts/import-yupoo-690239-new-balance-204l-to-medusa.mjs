import fs from "node:fs/promises"
import path from "node:path"

const cliArgs = process.argv.slice(2)
const dryRun = cliArgs.includes("--dry-run")
const limitArg = cliArgs.find((arg) => arg.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-690239"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "new-balance-204l-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const SOURCE_CATEGORY = "https://yolo66.x.yupoo.com/categories/690239?isSubCate=true"
const PRICE = 160

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const EU_SIZES = [
  "36", "37", "37.5", "38", "38.5", "39.5", "40", "40.5",
  "41.5", "42", "42.5", "43", "44", "44.5", "45",
]

const PRODUCT_DATA = {
  "U204L273-200": {
    name: "Cortado Stone Pink - Brown Edition",
    full: "Cortado/Stone Pink/Brown",
    colours: ["brown", "pink", "beige"],
    source: "Sneaks Up/SuperStep product listing and source shoe-box label",
    confidence: "verified",
  },
  U204L273: {
    name: "Cortado Stone Pink",
    full: "Cortado/Stone Pink",
    colours: ["brown", "pink"],
    source: "New Balance Korea/Sneaker News/PL-LINE",
    confidence: "verified",
  },
  U204LBC1: {
    name: "Basketcase Beef & Broccoli",
    full: "Brown/Green/Black",
    colours: ["brown", "green", "black"],
    source: "StockX/Dover Street Market/END.",
    confidence: "verified",
  },
  U204L6A6: {
    name: "Reflection Truffle Salt",
    full: "Reflection/Truffle Salt",
    colours: ["cream", "beige", "purple"],
    source: "New Balance",
    confidence: "verified",
  },
  U204L8OV: {
    name: "Lunar New Year Linen Shadow Red",
    full: "Linen/Shadow Red/Black",
    colours: ["white", "cream", "red", "black"],
    source: "New Balance",
    confidence: "verified",
  },
  U204L3K9: {
    name: "Lunar New Year Tan",
    full: "Tan/Black",
    colours: ["beige", "brown", "black"],
    source: "StockX/GOAT",
    confidence: "verified",
  },
  U204LSHE: {
    name: "Charcoal Grey",
    full: "Charcoal Grey/Silver",
    colours: ["grey", "silver"],
    source: "Source imagery and shoe-box style label; exact public colour name not found",
    confidence: "visible colour",
  },
  U204LMRA: {
    name: "Black Patent",
    full: "Black/Sea Salt",
    colours: ["black", "white"],
    source: "Source imagery and shoe-box style label; exact public colour name not found",
    confidence: "visible colour",
  },
  U204LMMA: {
    name: "Mushroom Arid Stone",
    full: "Mushroom/Arid Stone",
    colours: ["brown", "beige"],
    source: "New Balance",
    confidence: "verified",
  },
  U204LSWD: {
    name: "Silver Metallic Black",
    full: "Silver Metallic/Black",
    colours: ["silver", "black", "white"],
    source: "New Balance/StockX",
    confidence: "verified",
  },
  U204LSWB: {
    name: "Silver Metallic Garter Snake",
    full: "Silver Metallic/Garter Snake",
    colours: ["silver", "green", "white"],
    source: "New Balance",
    confidence: "verified",
  },
}

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const slugify = (value) =>
  value.toLowerCase().replace(/&/g, " and ").replace(/[().']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

const parseRange = (title) => {
  const match = String(title || "").match(/(\d{2}(?:\.\d)?)-(\d{2}(?:\.\d)?)/)
  if (!match) return []
  const min = Number(match[1])
  const max = Number(match[2])
  return EU_SIZES.filter((size) => Number(size) >= min && Number(size) <= max)
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
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
  }
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

const codeValuesFrom = (product) => [
  product.external_id,
  product.metadata?.product_code,
  product.metadata?.corrected_product_code,
  product.metadata?.style_code,
  product.title,
  product.handle,
].map((value) => String(value || "").toUpperCase())

const descriptionFor = (info, code) => [
  `The New Balance 204L ${info.name} brings the model's sleek, low-profile shape into a ${info.full.toLowerCase()} colourway.`,
  "The 204L blends the slim structure of a 1970s runner with the layered, technical texture of early-2000s footwear.",
  `Style ${code} features a multi-piece upper, arced overlay lines, and the distinctive 204L outsole for an easy retro-future look.`,
  "A lightweight EVA sole and traditional lace-up closure make it a comfortable everyday option with a streamlined finish.",
].join("\n\n")

const rawAlbums = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
rawAlbums.sort((a, b) => {
  if (a.product_code === "U204LBC1" && b.product_code === "U204LBC1") {
    return Number(b.source_title.includes("咖啡棕")) - Number(a.source_title.includes("咖啡棕"))
  }
  return a.index - b.index
})

const products = await listProducts()
const tags = await listTags()
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const baseTags = ["new-balance", "new-balance-204l"]
for (const tag of baseTags) await ensureTag(tagByValue, tag)

const reviewRows = [[
  "product_code", "product_name", "url_slug", "source_eu_sizes", "price",
  "colourway", "colour_tags", "colour_source", "colour_confidence",
  "source_category", "source_url", "source_title", "local_folder",
  "local_image_count", "thumbnail_local_file", "medusa_product_id",
  "medusa_handle", "import_status", "notes",
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
const seenCodes = new Set()
const seenHandles = new Set()
for (const album of rawAlbums) {
  const code = album.product_code
  const info = PRODUCT_DATA[code]
  const handle = info ? slugify(`new-balance-204l-${info.name}-${code}`) : ""
  const title = info ? `New Balance 204L - ${info.name}` : ""
  const sizes = parseRange(album.source_title)
  const colourTags = info?.colours.map((colour) => `colour:${colour}`) || []
  const thumbnailPath = album.local_images?.[7] || ""
  const alreadyExists = products.some((product) =>
    codeValuesFrom(product).some((value) => value.includes(String(code).toUpperCase())) || product.handle === handle
  )
  let status = dryRun ? "dry_run_create" : "create"
  let notes = ""

  if (!code || !info) {
    status = "needs_review"
    notes = "Missing a stable style code or reviewed product data; not imported."
  } else if (seenCodes.has(code) || seenHandles.has(handle)) {
    status = "skipped_duplicate_scrape"
    notes = "Duplicate Yupoo album for the same style code; coffee-brown U204LBC1 source kept."
  } else if (alreadyExists) {
    status = "skipped_existing"
    notes = "Already present in Medusa by style code or handle; not duplicated."
  } else if (!sizes.length) {
    status = "needs_review"
    notes = "No New Balance EU sizes fit the source range; not imported."
  } else if ((album.local_images || []).length !== 8) {
    status = "needs_review"
    notes = "The album does not contain exactly 8 downloaded images; not imported."
  } else if (!thumbnailPath.endsWith("/08.jpg")) {
    status = "needs_review"
    notes = "The reviewed shoe-on-box thumbnail is unavailable; not imported."
  }

  reviewRows.push([
    code, title, handle, sizes.join(" | "), PRICE, info?.full || "",
    colourTags.join(" | "), info?.source || "", info?.confidence || "",
    SOURCE_CATEGORY, album.source_url, album.source_title, album.local_folder,
    album.local_images?.length || 0, thumbnailPath, "", handle, status, notes,
  ])

  if (status === "create" || status === "dry_run_create") {
    seenCodes.add(code)
    seenHandles.add(handle)
    jobs.push({ album, code, info, handle, title, sizes, colourTags, thumbnailPath })
  } else {
    if (code) seenCodes.add(code)
    if (handle) seenHandles.add(handle)
    const bucket = status === "needs_review" ? report.needs_review : report.skipped
    bucket.push({ product_code: code, title, handle, status, notes, source_url: album.source_url })
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

  const orderedLocalImages = [
    job.thumbnailPath,
    ...job.album.local_images.filter((filePath) => filePath !== job.thumbnailPath),
  ]
  const files = []
  if (!dryRun) {
    for (const filePath of orderedLocalImages) {
      files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
    }
  }
  const imageUrls = files.map((file) => file.url)
  const variants = job.sizes.map((euSize) => ({
    title: euSize,
    sku: `MUSE-NB204L-YUP690239-${job.code}-${euSize}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
    external_id: `YUP690239-${job.code}`,
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
      model: "New Balance 204L",
      source_size_system: "eu",
      display_size_system: "eu",
      size_display_note: "Sizes are shown as EU buttons.",
      colourway: job.info.name,
      full_colourway: job.info.full,
      colour_tags: job.colourTags.join(" | "),
      colour_confidence: job.info.confidence,
      colour_source: job.info.source,
      source_eu_sizes: job.sizes.join(" | "),
      thumbnail_rule: "shoe-on-shoe-box",
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
      thumbnail_local_file: job.thumbnailPath,
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
    thumbnail: created.product?.thumbnail,
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
