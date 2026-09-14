import fs from "node:fs/promises"
import path from "node:path"

const cliArgs = process.argv.slice(2)
const dryRun = cliArgs.includes("--dry-run")
const limitArg = cliArgs.find((arg) => arg.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-891233"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "adidas-adistar-jellyfish-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const SOURCE_CATEGORY = "https://yolo66.x.yupoo.com/categories/891233?isSubCate=true"
const PRICE = 170

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const SIZE_MAP = {
  "35.5": { usMen: "3.5", usWomen: "5", uk: "3", cm: "22" },
  "36": { usMen: "4", usWomen: "5.5", uk: "3.5", cm: "22.5" },
  "36.5": { usMen: "4.5", usWomen: "6", uk: "4", cm: "23" },
  "37": { usMen: "5", usWomen: "6.5", uk: "4.5", cm: "23.5" },
  "38": { usMen: "5.5", usWomen: "7", uk: "5", cm: "24" },
  "38.5": { usMen: "6", usWomen: "7.5", uk: "5.5", cm: "24.5" },
  "39": { usMen: "6.5", usWomen: "8", uk: "6", cm: "25" },
  "40": { usMen: "7", usWomen: "8.5", uk: "6.5", cm: "25.5" },
  "40.5": { usMen: "7.5", usWomen: "9", uk: "7", cm: "26" },
  "41": { usMen: "8", usWomen: "9.5", uk: "7.5", cm: "26.5" },
  "42": { usMen: "8.5", usWomen: "10", uk: "8", cm: "27" },
  "42.5": { usMen: "9", usWomen: "10.5", uk: "8.5", cm: "27.5" },
  "43": { usMen: "9.5", usWomen: "11", uk: "9", cm: "28" },
  "44": { usMen: "10", usWomen: "11.5", uk: "9.5", cm: "28.5" },
  "45": { usMen: "11", usWomen: "12.5", uk: "10.5", cm: "29" },
}

const PRODUCT_DATA = {
  JP9273: { name: "Focus Pink Core Black", full: "Focus Pink/Cloud White/Core Black", colours: ["pink", "white", "black"], source: "public product listing and source imagery", confidence: "verified" },
  JP9271: { name: "Cloud White Red Black", full: "Cloud White/Grey/Core Black/Red", colours: ["white", "grey", "black", "red"], source: "source imagery", confidence: "visible colour" },
  JP9276: { name: "Focus Pink Silver", full: "Focus Pink/Silver Metallic/Core Black", colours: ["pink", "silver", "black"], source: "source imagery", confidence: "visible colour" },
  JP9272: { name: "Triple Black", full: "Core Black/Core Black/Core Black", colours: ["black"], source: "source imagery", confidence: "visible colour" },
  JP9260: { name: "Real Green", full: "Focus Olive/Core Black/Real Green", colours: ["green", "olive", "black"], source: "StockX", confidence: "verified" },
  JP9266: { name: "Core Black Red", full: "Core Black/Red/Grey", colours: ["black", "red", "grey"], source: "source imagery and Yupoo title colour note", confidence: "visible colour" },
  JP9269: { name: "Cloud White Orange", full: "Cloud White/Core Black/Orange", colours: ["white", "black", "orange"], source: "source imagery", confidence: "visible colour" },
  JP9275: { name: "Purple Orange", full: "Purple/Core Black/Orange/Yellow", colours: ["purple", "black", "orange", "yellow"], source: "source imagery", confidence: "visible colour" },
  KJ5768: { name: "Core Black Multicolour", full: "Core Black/Green/Yellow/Purple", colours: ["black", "green", "yellow", "purple"], source: "source imagery", confidence: "visible colour" },
  KI0164: { name: "Silver Pink", full: "Silver Metallic/Cloud White/Pink", colours: ["silver", "white", "pink"], source: "source imagery and inside-label code correction", confidence: "visible colour" },
  JP9274: { name: "Wonder Pink", full: "Wonder Pink/Wonder Pink/Wonder Pink", colours: ["pink"], source: "source imagery", confidence: "visible colour" },
  JP9262: { name: "Silver Metallic Black", full: "Silver Metallic/Core Black/Cream", colours: ["silver", "black", "cream"], source: "source imagery", confidence: "visible colour" },
  JP9265: { name: "Solid Grey Black", full: "Solid Grey/Core Black/Silver Metallic", colours: ["grey", "black", "silver"], source: "public product listing and source imagery", confidence: "verified" },
  JP9261: { name: "Focus Olive Orange", full: "Focus Olive/Core Black/Orange", colours: ["olive", "black", "orange"], source: "StockX", confidence: "verified" },
  JP9268: { name: "Silver Purple", full: "Silver Metallic/Purple/Core Black", colours: ["silver", "purple", "black"], source: "source imagery", confidence: "visible colour" },
  JP9267: { name: "Silver Yellow", full: "Silver Metallic/Yellow/Core Black", colours: ["silver", "yellow", "black"], source: "source imagery", confidence: "visible colour" },
  JP9277: { name: "Sand Black", full: "Sand/Cream/Core Black", colours: ["beige", "cream", "black"], source: "source imagery", confidence: "visible colour" },
  JP9270: { name: "Focus Olive Yellow", full: "Focus Olive/Core Black/Yellow", colours: ["olive", "black", "yellow"], source: "source imagery", confidence: "visible colour" },
  IG1738: { name: "Grey Pink", full: "Grey/Cloud White/Pink", colours: ["grey", "white", "pink"], source: "source imagery", confidence: "visible colour" },
  HQ7468: { name: "Cloud White Orange", full: "Cloud White/Core Black/Orange", colours: ["white", "black", "orange"], source: "source imagery and inside-label code correction", confidence: "visible colour" },
  JP6759: { name: "Triple Black", full: "Core Black/Core Black/Core Black", colours: ["black"], source: "source imagery", confidence: "visible colour" },
  JP9263: { name: "Royal Blue", full: "Royal Blue/Core Black/Focus Olive", colours: ["blue", "black", "olive"], source: "StockX", confidence: "verified" },
}

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
const slugify = (value) => value.toLowerCase().replace(/&/g, " and ").replace(/[().']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
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
  const body = await adminFetch("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) })
  const tag = body.product_tag || body.tag
  tagByValue.set(value, tag)
  return tag
}

const codeValuesFrom = (product) => [product.external_id, product.metadata?.product_code, product.metadata?.corrected_product_code, product.metadata?.style_code, product.title, product.handle].map((value) => String(value || "").toUpperCase())
const descriptionFor = (info, code) => [
  `The adidas Adistar Jellyfish ${info.name} brings Pharrell Williams' expressive design language into a ${info.full.toLowerCase()} colourway.`,
  "Its sculpted, layered upper combines breathable textile panels with supportive overlays for the fluid, futuristic look that defines the Adistar Jellyfish.",
  `Style ${code} balances bold proportions with everyday comfort, using a cushioned sole, padded collar, and secure traditional lace closure.`,
  "The exaggerated heel geometry and technical running-inspired details make it an easy statement pair for relaxed denim, cargos, and modern streetwear.",
].join("\n\n")

const rawAlbums = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
rawAlbums.sort((a, b) => {
  if (a.product_code === "JP9266" && b.product_code === "JP9266") return Number(b.source_title.includes("黑红")) - Number(a.source_title.includes("黑红"))
  return a.index - b.index
})
const products = await listProducts()
const tags = await listTags()
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const baseTags = ["adidas", "adidas-adistar-jellyfish"]
for (const value of baseTags) await ensureTag(tagByValue, value)

const reviewRows = [[
  "product_code", "product_name", "url_slug", "price", "size_buttons", "source_eu_sizes",
  "colourway", "colour_tags", "colour_source", "colour_confidence", "source_category", "source_url",
  "source_title", "local_folder", "downloaded_image_count", "uploaded_image_files", "excluded_label_file",
  "thumbnail_local_file", "medusa_product_id", "medusa_handle", "import_status", "notes",
]]
const report = { started_at: new Date().toISOString(), dry_run: dryRun, backend_url: BACKEND_URL, source_category: SOURCE_CATEGORY, price: PRICE, created: [], skipped: [], needs_review: [] }
const sizes = Object.entries(SIZE_MAP).map(([eu, value]) => ({ eu, ...value, display: `M ${value.usMen} / W ${value.usWomen}` }))
const jobs = []
const seenCodes = new Set()
const seenHandles = new Set()

for (const album of rawAlbums) {
  const code = album.product_code
  const info = PRODUCT_DATA[code]
  const title = info ? `adidas Adistar Jellyfish Pharrell Williams ${info.name}` : ""
  const handle = info ? slugify(`${title}-${code}`) : ""
  const colourTags = info?.colours.map((colour) => `colour:${colour}`) || []
  const byName = new Map((album.local_images || []).map((filePath) => [path.basename(filePath), filePath]))
  const thumbnailPath = byName.get("09.jpg") || ""
  const uploadPaths = [thumbnailPath, ...["02.jpg", "03.jpg", "04.jpg", "05.jpg", "06.jpg", "07.jpg", "08.jpg"].map((name) => byName.get(name))].filter(Boolean)
  const excludedLabelPath = byName.get("01.jpg") || ""
  const alreadyExists = products.some((product) => codeValuesFrom(product).some((value) => value.includes(String(code).toUpperCase())) || product.handle === handle)
  let status = dryRun ? "dry_run_create" : "create"
  let notes = ""
  if (!code || !info) { status = "needs_review"; notes = "Missing a stable reviewed style code or colour record; not imported." }
  else if (seenCodes.has(code) || seenHandles.has(handle)) { status = "skipped_duplicate_scrape"; notes = "Duplicate Yupoo album for the same style code; one JP9266 product kept." }
  else if (alreadyExists) { status = "skipped_existing"; notes = "Already present in Medusa by style code or handle; not duplicated." }
  else if ((album.local_images || []).length !== 10) { status = "needs_review"; notes = "Album did not download all 10 source images; not imported." }
  else if (!excludedLabelPath.endsWith("/01.jpg")) { status = "needs_review"; notes = "Inside shoe-label image could not be positively identified; not imported." }
  else if (uploadPaths.length !== 8 || !thumbnailPath.endsWith("/09.jpg")) { status = "needs_review"; notes = "Reviewed 8-image set or shoe-on-box thumbnail is incomplete; not imported." }

  reviewRows.push([code, title, handle, PRICE, sizes.map((size) => size.display).join(" | "), sizes.map((size) => size.eu).join(" | "), info?.full || "", colourTags.join(" | "), info?.source || "", info?.confidence || "", SOURCE_CATEGORY, album.source_url, album.source_title, album.local_folder, album.local_images?.length || 0, uploadPaths.join(" | "), excludedLabelPath, thumbnailPath, "", handle, status, notes])
  if (status === "create" || status === "dry_run_create") {
    seenCodes.add(code); seenHandles.add(handle); jobs.push({ album, code, info, title, handle, colourTags, uploadPaths, excludedLabelPath, thumbnailPath })
  } else {
    if (code) seenCodes.add(code); if (handle) seenHandles.add(handle)
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
  const files = []
  if (!dryRun) for (const filePath of job.uploadPaths) files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
  const imageUrls = files.map((file) => file.url)
  const variants = sizes.map((size) => ({
    title: size.display,
    sku: `MUSE-ADIDAS-JELLYFISH-891233-${job.code}-${size.eu}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: true,
    manage_inventory: false,
    weight: 400,
    options: { Size: size.display },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
    metadata: { eu_size: size.eu, us_mens_size: size.usMen, us_womens_size: size.usWomen, uk_size: size.uk, cm_jp_size: size.cm, display_size: size.display, size_system: "adidas-us-men-women", source_size_system: "eu" },
  }))
  const payload = {
    title: job.title,
    subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
    handle: job.handle,
    description: descriptionFor(job.info, job.code),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: `YUP891233-${job.code}`,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [{ title: "Size", values: sizes.map((size) => size.display) }],
    variants,
    shipping_profile_id: IDS.shippingProfile,
    collection_id: IDS.collection,
    categories: [{ id: IDS.category }],
    type_id: IDS.productType,
    tags: productTags.map((tag) => ({ id: tag.id })),
    sales_channels: [{ id: IDS.salesChannel }],
    metadata: {
      source: "yupoo", source_url: job.album.source_url, source_title: job.album.source_title, source_category: SOURCE_CATEGORY,
      product_code: job.code, corrected_product_code: job.code, brand: "adidas", model: "adidas Adistar Jellyfish", collaboration: "Pharrell Williams",
      line_tag: "adidas-adistar-jellyfish", source_size_system: "eu", display_size_system: "adidas-us-men-women",
      size_display_note: "Sizes are shown as US Men's / US Women's.", size_chart: "adidas-adult-us-men-women",
      colourway: job.info.name, full_colourway: job.info.full, colour_tags: job.colourTags.join(" | "), colour_confidence: job.info.confidence, colour_source: job.info.source,
      source_eu_sizes: sizes.map((size) => size.eu).join(" | "), thumbnail_rule: "shoe-on-shoe-box", excluded_source_images: "01.jpg inside shoe label tag",
      fit_sized_down_percent: "1", fit_true_to_size_percent: "88", fit_sized_up_percent: "11",
    },
  }
  if (dryRun) {
    report.created.push({ product_code: job.code, title: job.title, handle: job.handle, variant_count: variants.length, size_buttons: sizes.map((size) => size.display), tags: tagValues, price: PRICE, image_count: job.uploadPaths.length, thumbnail_local_file: job.thumbnailPath, excluded_label_file: job.excludedLabelPath, dry_run: true })
    console.log(`Would create ${index}/${Math.min(jobs.length, limit)}: ${job.code} images=${job.uploadPaths.length} variants=${variants.length}`)
    continue
  }
  const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,thumbnail,*images,*variants,*tags,metadata", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
  report.created.push({ product_id: created.product?.id, external_id: created.product?.external_id, title: created.product?.title, handle: created.product?.handle, thumbnail: created.product?.thumbnail, image_count: created.product?.images?.length, variant_count: created.product?.variants?.length, size_buttons: sizes.map((size) => size.display), tags: tagValues, price: PRICE, excluded_label_file: job.excludedLabelPath, files })
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Created ${index}/${Math.min(jobs.length, limit)}: ${job.code} ${created.product?.id}`)
}

await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
