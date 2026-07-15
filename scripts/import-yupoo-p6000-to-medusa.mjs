import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ROOT_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports"
const BATCHES = [
  {
    slug: "yupoo-category-907068",
    sourceCategory: "https://yolo66.x.yupoo.com/categories/907068?isSubCate=true",
  },
  {
    slug: "yupoo-category-597234",
    sourceCategory: "https://yolo66.x.yupoo.com/categories/597234?isSubCate=true",
  },
]
const OUT_DIR = path.join(ROOT_DIR, "yupoo-p6000-907068-597234")
const REVIEW_PATH = path.join(OUT_DIR, "nike-p6000-enriched-review.csv")
const REPORT_PATH = path.join(OUT_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")

const PRICE = 170
const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const SIZE_MAP = {
  "35.5": { eu_size: "35.5", us_mens_size: "3.5", us_womens_size: "5", us_kids_size: "3.5Y", uk_size: "3", cm_jp_size: "22.5", display_size: "M 3.5 / W 5" },
  "36": { eu_size: "36", us_mens_size: "4", us_womens_size: "5.5", us_kids_size: "4Y", uk_size: "3.5", cm_jp_size: "23", display_size: "M 4 / W 5.5" },
  "36.5": { eu_size: "36.5", us_mens_size: "4.5", us_womens_size: "6", us_kids_size: "4.5Y", uk_size: "4", cm_jp_size: "23.5", display_size: "M 4.5 / W 6" },
  "37.5": { eu_size: "37.5", us_mens_size: "5", us_womens_size: "6.5", us_kids_size: "5Y", uk_size: "4.5", cm_jp_size: "23.5", display_size: "M 5 / W 6.5" },
  "38": { eu_size: "38", us_mens_size: "5.5", us_womens_size: "7", us_kids_size: "5.5Y", uk_size: "5", cm_jp_size: "24", display_size: "M 5.5 / W 7" },
  "38.5": { eu_size: "38.5", us_mens_size: "6", us_womens_size: "7.5", us_kids_size: "6Y", uk_size: "5.5", cm_jp_size: "24", display_size: "M 6 / W 7.5" },
  "39": { eu_size: "39", us_mens_size: "6.5", us_womens_size: "8", us_kids_size: "6.5Y", uk_size: "6", cm_jp_size: "24.5", display_size: "M 6.5 / W 8" },
  "40": { eu_size: "40", us_mens_size: "7", us_womens_size: "8.5", us_kids_size: "7Y", uk_size: "6", cm_jp_size: "25", display_size: "M 7 / W 8.5" },
  "40.5": { eu_size: "40.5", us_mens_size: "7.5", us_womens_size: "9", uk_size: "6.5", cm_jp_size: "25.5", display_size: "M 7.5 / W 9" },
  "41": { eu_size: "41", us_mens_size: "8", us_womens_size: "9.5", uk_size: "7", cm_jp_size: "26", display_size: "M 8 / W 9.5" },
  "42": { eu_size: "42", us_mens_size: "8.5", us_womens_size: "10", uk_size: "7.5", cm_jp_size: "26.5", display_size: "M 8.5 / W 10" },
  "42.5": { eu_size: "42.5", us_mens_size: "9", us_womens_size: "10.5", uk_size: "8", cm_jp_size: "27", display_size: "M 9 / W 10.5" },
  "43": { eu_size: "43", us_mens_size: "9.5", us_womens_size: "11", uk_size: "8.5", cm_jp_size: "27.5", display_size: "M 9.5 / W 11" },
  "44": { eu_size: "44", us_mens_size: "10", us_womens_size: "11.5", uk_size: "9", cm_jp_size: "28", display_size: "M 10 / W 11.5" },
  "44.5": { eu_size: "44.5", us_mens_size: "10.5", us_womens_size: "12", uk_size: "9.5", cm_jp_size: "28.5", display_size: "M 10.5 / W 12" },
  "45": { eu_size: "45", us_mens_size: "11", us_womens_size: "12.5", uk_size: "10", cm_jp_size: "29", display_size: "M 11 / W 12.5" },
  "45.5": { eu_size: "45.5", us_mens_size: "11.5", us_womens_size: "13", uk_size: "10.5", cm_jp_size: "29.5", display_size: "M 11.5 / W 13" },
  "46": { eu_size: "46", us_mens_size: "12", us_womens_size: "13.5", uk_size: "11", cm_jp_size: "30", display_size: "M 12 / W 13.5" },
  "47": { eu_size: "47", us_mens_size: "12.5", us_womens_size: "14", uk_size: "11.5", cm_jp_size: "30.5", display_size: "M 12.5 / W 14" },
  "47.5": { eu_size: "47.5", us_mens_size: "13", us_womens_size: "14.5", uk_size: "12", cm_jp_size: "31", display_size: "M 13 / W 14.5" },
}

const SIZE_ORDER = Object.keys(SIZE_MAP).map(Number).sort((a, b) => a - b)
const SKIP_CODES = new Set(["FJ5443-113", "CJ7789-162", "BV1021-100", "BV1021-105", "CD6404-202"])
const CODE_FIXES = {
  I03496: "IO3496",
  "I03496-001": "IO3496-001",
  I01904: "IO1904",
  "I01904-104": "IO1904-104",
  "HJ7246--100": "HJ7246-100",
}

const COLOUR_WORDS = {
  black: "black",
  blue: "blue",
  brown: "brown",
  cream: "cream",
  grey: "grey",
  green: "green",
  orange: "orange",
  pink: "pink",
  red: "red",
  silver: "silver",
  white: "white",
  yellow: "yellow",
  黑: "black",
  白: "white",
  蓝: "blue",
  棕: "brown",
  粉: "pink",
  银: "silver",
  褐: "brown",
  亮银: "silver",
}

const args = new Set(process.argv.slice(2))
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

const normaliseCode = (code) => CODE_FIXES[code] || code

const parseCode = (title, fallback) => {
  const candidates = [...String(title || "").matchAll(/\b[A-Z]{1,3}\d{3,5}-+\d{3}\b/g)]
    .map((match) => match[0].replace(/-+/g, "-"))
    .filter((code) => code !== "P-6000")
  const code = candidates.at(-1) || fallback || ""
  const normalised = normaliseCode(code)
  return normalised === "6000" ? "" : normalised
}

const parseRange = (title) => {
  const match = [...String(title || "").matchAll(/(\d{2}(?:\.\d)?)-(\d{2}(?:\.\d)?)/g)]
    .find((candidate) => {
      const min = Number(candidate[1])
      const max = Number(candidate[2])
      return min >= 30 && min <= 50 && max >= 30 && max <= 50 && min <= max
    })
  if (!match) return []
  const min = Number(match[1])
  const max = Number(match[2])
  return SIZE_ORDER.filter((size) => size >= min && size <= max).map((size) => String(size))
}

const coloursFromTitle = (title) => {
  const colours = []
  for (const [word, colour] of Object.entries(COLOUR_WORDS)) {
    if (String(title).toLowerCase().includes(word.toLowerCase()) && !colours.includes(colour)) {
      colours.push(colour)
    }
  }
  return colours
}

const descriptionFor = (code, colours) => {
  const colourText = colours.length ? `${colours.join(", ")} ` : ""
  return [
    `The Nike P-6000 ${code} brings late-2000s running energy into a layered everyday sneaker with a ${colourText}technical look.`,
    "The silhouette uses a breathable mesh base, synthetic overlays, and the P-6000's signature panelled shape for an easy retro-runner finish.",
    `Style ${code} keeps the profile versatile enough for daily rotation, pairing cleanly with relaxed denim, cargos, and simple streetwear layers.`,
    "A cushioned midsole, padded collar, and low-profile build make it a practical option for all-day casual wear.",
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
    .flatMap((value) => [...String(value || "").matchAll(/\b[A-Z]{1,3}\d{3,5}-\d{3}\b/g)].map((match) => normaliseCode(match[0])))
    .filter(Boolean)
}

await fs.mkdir(OUT_DIR, { recursive: true })

const rawAlbums = []
for (const batch of BATCHES) {
  const rawPath = path.join(ROOT_DIR, batch.slug, "raw-albums.json")
  const albums = JSON.parse(await fs.readFile(rawPath, "utf8"))
  rawAlbums.push(...albums.map((album) => ({ ...album, batch })))
}

const products = await listProducts()
const existingCodes = new Set(products.flatMap(productCodesFrom))
const existingHandles = new Set(products.map((product) => product.handle).filter(Boolean))
const tags = await listTags()
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const baseTagValues = ["nike", "nike-p-6000"]
for (const value of baseTagValues) await ensureTag(tagByValue, value)

const seenCodes = new Set()
const jobs = []
const reviewRows = [[
  "product_code",
  "product_name",
  "url_slug",
  "source_eu_sizes",
  "display_sizes",
  "colour_tags",
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

for (const album of rawAlbums) {
  const code = parseCode(album.source_title, album.product_code)
  const sourceEuSizes = parseRange(album.source_title)
  const displaySizes = sourceEuSizes.map((size) => SIZE_MAP[size].display_size)
  const handle = slugify(`nike-p-6000-${code}`)
  const title = code ? `Nike P-6000 - ${code}` : ""
  const colours = coloursFromTitle(album.source_title)
  const colourTags = colours.map((colour) => `colour:${colour}`)
  let status = "pending"
  let notes = ""

  if (!code) {
    status = "needs_review"
    notes = "No reliable product code found in Yupoo title; not imported."
  } else if (SKIP_CODES.has(code)) {
    status = "skipped_user"
    notes = "Skipped per user request."
  } else if (seenCodes.has(code)) {
    status = "skipped_duplicate_scrape"
    notes = "Duplicate product code in requested Yupoo pages; first occurrence kept."
  } else if (existingCodes.has(code) || existingHandles.has(handle)) {
    status = "skipped_existing"
    notes = "Already present in Medusa; not duplicated or replaced."
  } else if (sourceEuSizes.length === 0) {
    status = "needs_review"
    notes = "No supported Nike EU size range found; not imported."
  } else if ((album.local_images || []).length < 8) {
    status = "needs_review"
    notes = "Fewer than 8 local images; not imported."
  } else {
    status = dryRun ? "dry_run_create" : "create"
  }

  reviewRows.push([
    code,
    title,
    handle,
    sourceEuSizes.join(" | "),
    displaySizes.join(" | "),
    colourTags.join(" | "),
    colours.length ? "partial" : "needs review",
    album.source_url,
    album.source_title,
    album.local_folder,
    album.local_images?.length || 0,
    "",
    handle,
    status,
    notes || "Colourway name not verified; style code used transparently.",
  ])

  if (status === "create" || status === "dry_run_create") {
    seenCodes.add(code)
    jobs.push({ album, code, title, handle, sourceEuSizes, displaySizes, colours, colourTags })
  } else if (code) {
    seenCodes.add(code)
  }
}

const report = {
  started_at: new Date().toISOString(),
  dry_run: dryRun,
  backend_url: BACKEND_URL,
  created: [],
  skipped: reviewRows.slice(1).filter((row) => !["create", "dry_run_create"].includes(row[13])).map((row) => ({
    product_code: row[0],
    status: row[13],
    notes: row[14],
  })),
}

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Raw albums: ${rawAlbums.length}`)
console.log(`Jobs to create: ${jobs.length}`)
console.log(`Skipped/needs review: ${report.skipped.length}`)

let index = 0
for (const job of jobs.slice(0, limit)) {
  index += 1
  const tagValues = [...baseTagValues, ...job.colourTags]
  const productTags = []
  for (const value of tagValues) productTags.push(await ensureTag(tagByValue, value))

  const files = []
  if (!dryRun) {
    for (const filePath of job.album.local_images.slice(0, 8)) {
      files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
    }
  }
  const imageUrls = files.map((file) => file.url)
  const variants = job.sourceEuSizes.map((euSize) => {
    const size = SIZE_MAP[euSize]
    return {
      title: size.display_size,
      sku: `MUSE-P6000-${job.code}-${euSize}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
        source_size_system: "eu",
        size_system: "nike-jordan-us",
      },
    }
  })

  const payload = {
    title: job.title,
    subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
    handle: job.handle,
    description: descriptionFor(job.code, job.colours),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: `YUPP6000-${job.code}`,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [{ title: "Size", values: job.displaySizes }],
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
      model: "Nike P-6000",
      colourway: job.code,
      colour_tags: job.colourTags.join(" | "),
      colour_confidence: job.colours.length ? "partial" : "needs review",
      colour_source: "Yupoo title only; style code used because colourway was not manually verified",
      source_eu_sizes: job.sourceEuSizes.join(" | "),
      display_size_system: "nike-jordan-us",
      source_size_system: "eu",
      size_display_note: "Sizes are shown as US Men's / US Women's.",
    },
  }

  if (dryRun) {
    report.created.push({
      product_code: job.code,
      title: job.title,
      handle: job.handle,
      variants: variants.length,
      display_sizes: job.displaySizes,
      tags: tagValues,
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
    display_sizes: job.displaySizes,
    tags: tagValues,
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
