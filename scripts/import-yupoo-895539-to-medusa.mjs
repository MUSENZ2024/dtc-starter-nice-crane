import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-895539"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "gel-kayano-14-bd-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")

const SIZES = ["36", "37", "37.5", "38", "39", "39.5", "40", "40.5", "41.5", "42", "42.5", "43.5", "44", "44.5", "45", "46", "46.5"]
const PRICE = 160

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}

const COLOUR_WORDS = {
  antler: "beige",
  asics: null,
  beige: "beige",
  beryl: "green",
  birch: "beige",
  black: "black",
  blue: "blue",
  brown: "brown",
  cement: "grey",
  clay: "grey",
  concrete: "grey",
  cream: "cream",
  dark: null,
  dried: null,
  glacier: "grey",
  gold: "gold",
  green: "green",
  grey: "grey",
  illuminate: "yellow",
  ivory: "cream",
  jade: "green",
  lake: "blue",
  leaf: "green",
  lemon: "yellow",
  lime: "green",
  metallic: "silver",
  moonrock: "grey",
  navy: "blue",
  orange: "orange",
  papaya: "orange",
  pepper: "brown",
  pewter: "grey",
  piquant: "orange",
  pistachio: "green",
  pure: null,
  raw: null,
  rock: "grey",
  scarab: "green",
  seal: "grey",
  sepia: "brown",
  sheet: "grey",
  silver: "silver",
  simply: null,
  soft: null,
  taupe: "beige",
  teal: "blue",
  thunder: "blue",
  tarmac: "grey",
  vanilla: "cream",
  white: "white",
  yellow: "yellow",
}

const PRODUCT_DATA = {
  "1203B110-020": { name: "Thom Browne Grey", colourway: "Grey Grey", source: "StockX" },
  "1203B110-001": { name: "Thom Browne Black", colourway: "Black Black", source: "StockX" },
  "1203A740-750": { name: "Soft Yellow Asics Blue", colourway: "Soft Yellow Asics Blue", source: "StockX" },
  "1203A537-200": { name: "Birch Pure Silver", colourway: "Birch Pure Silver", source: "StockX" },
  "1203A537-112": { name: "Cream Pistachio", colourway: "Cream Pistachio", source: "StockX" },
  "1201A019-751": { name: "Illuminate Yellow", colourway: "Illuminate Yellow Black Silver", source: "StockX" },
  "1203A740-101": { name: "Silver Papaya", colourway: "White Papaya", source: "StockX" },
  "1203A537-201": { name: "Sepia Pure Silver", colourway: "Sepia Pure Silver", source: "StockX" },
  "1203A706-020": { name: "Urban Research", colourway: "Pure Silver Black", source: "StockX" },
  "1203A704-020": { name: "Beauty & Youth", colourway: "Metallic Silver Grey White", source: "StockX" },
  "1201A935-001": { name: "Black Glacier Grey Silver", colourway: "Black Glacier Grey Silver", source: "StockX" },
  "1203A993-020": { name: "Kith Chicago", colourway: "Dark Pewter Metallic Silver Blue", source: "StockX" },
  "1203A537-300": { name: "Dried Leaf Green Pure Silver", colourway: "Dried Leaf Green Pure Silver", source: "StockX" },
  "1203A961-100": { name: "JJJJound White Navy", colourway: "White Navy", source: "StockX" },
  "1203A566-100": { name: "Kith Cream Scarab (2024)", colourway: "Cream Scarab", source: "StockX" },
  "1203A537-001": { name: "Black Lemon Spark", colourway: "Black Lemon Spark", source: "StockX" },
  "1203A537-109": { name: "Birch Pure Silver Teal Gold", colourway: "Birch Pure Silver Teal Gold", source: "StockX" },
  "1201A019-109": { name: "White Piquant Orange", colourway: "White Piquant Orange", source: "StockX" },
  "1203A430-200": { name: "atmos Undermycar Pepper", colourway: "Pepper Black", source: "StockX" },
  "1201A019-250": { name: "Vanilla Tarmac", colourway: "Vanilla Tarmac", source: "StockX" },
  "1203A537-101": { name: "Tai Chi Yellow", colourway: "White Tai Chi Yellow", source: "StockX" },
  "1202A056-106": { name: "White Moonrock", colourway: "White Moonrock", source: "StockX" },
  "1203A537-102": { name: "Cream Metallic Blue", colourway: "Cream Metallic Blue", source: "StockX" },
  "1202A056-110": { name: "White Simply Taupe", colourway: "White Simply Taupe", source: "StockX" },
  "1202A056-103": { name: "White Thunder Blue", colourway: "White Thunder Blue", source: "StockX" },
  "1201A019-005": { name: "Black Seal Grey", colourway: "Black Seal Grey", source: "StockX" },
  "1203A537-104": { name: "Olympic Medals", colourway: "White Cream Gold", source: "StockX" },
  "1201A954-101": { name: "Kith Cream Antler", colourway: "Cream Antler", source: "StockX" },
  "1202A056-105": { name: "White Jade", colourway: "White Jade", source: "StockX" },
  "1202A056-113": { name: "Cream Pepper", colourway: "Cream Pepper", source: "StockX" },
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

const coloursFor = (text) => {
  const colours = []
  for (const word of String(text).toLowerCase().split(/[^a-z]+/)) {
    const colour = COLOUR_WORDS[word]
    if (colour && !colours.includes(colour)) colours.push(colour)
  }
  return colours
}

const descriptionFor = (name, colourway, code) => [
  `The ASICS Gel-Kayano 14 ${name} brings ASICS sportstyle heritage into a layered technical runner with a ${colourway.toLowerCase()} colourway.`,
  "Built around the Gel-Kayano 14's recognisable mesh-and-overlay construction, the shoe balances retro running detail with everyday streetwear wearability.",
  "Metallic and tonal panel work gives the upper depth, while the sculpted midsole and GEL cushioning keep the silhouette unmistakably ASICS.",
  `Style ${code} is a strong option for anyone wanting a clean technical sneaker with enough colour detail to stand out without overpowering a rotation.`,
  `Pair the Gel-Kayano 14 ${name} with cargos, relaxed denim, or simple layered basics for an easy sportstyle finish.`,
].join("\n\n")

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
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
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
  for (let offset = 0; offset < 1000; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,metadata`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) break
  }
  return products
}

const listTags = async () => {
  const body = await adminFetch("/admin/product-tags?limit=200")
  return body.product_tags || body.tags || []
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

const baseTags = ["asics", "asics-gel-kayano-14"]
for (const tag of baseTags) await ensureTag(tagByValue, tag)

const reviewRows = [[
  "product_code", "product_name", "url_slug", "colourway", "colour_tags", "colour_source", "colour_confidence", "source_url", "source_title", "local_folder", "local_image_count", "status", "notes",
]]

const report = { started_at: new Date().toISOString(), dry_run: dryRun, created: [], skipped: [], missing_research: [] }

for (const album of raw) {
  const code = album.product_code
  if (existingCodes.has(code)) {
    reviewRows.push([
      code,
      "",
      "",
      "",
      "",
      "",
      "",
      album.source_url,
      album.source_title,
      album.local_folder,
      album.local_images?.length || 0,
      "skipped_existing",
      "Already present in Medusa; not duplicated or replaced.",
    ])
    report.skipped.push({ code, source_title: album.source_title, reason: "already exists" })
    console.log(`Skipped existing ${code}: ${album.source_title}`)
    continue
  }

  const item = PRODUCT_DATA[code]
  if (!item) {
    report.missing_research.push({ code, source_title: album.source_title })
    continue
  }

  const title = `ASICS Gel-Kayano 14 - ${item.name}`
  const handle = slugify(title)
  const colours = coloursFor(`${item.name} ${item.colourway}`)
  const tagValues = [...baseTags, ...colours.map((colour) => `colour:${colour}`)]
  const status = existingHandles.has(handle) ? "skipped_existing" : "create"
  reviewRows.push([
    code,
    title,
    handle,
    item.colourway,
    colours.map((colour) => `colour:${colour}`).join(" | "),
    item.source,
    "verified",
    album.source_url,
    album.source_title,
    album.local_folder,
    album.local_images?.length || 0,
    status,
    status === "skipped_existing" ? "Already present in Medusa; not duplicated or replaced." : "",
  ])

  if (status === "skipped_existing") {
    report.skipped.push({ code, title, handle, reason: "already exists" })
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
    description: descriptionFor(item.name, item.colourway, code),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: `YUP895539-${code}`,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [{ title: "Size", values: SIZES }],
    variants: SIZES.map((size) => ({
      title: size,
      sku: `MUSE-GK14-BD-YUP895539-${code}-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
      source_category: "https://yolo88.x.yupoo.com/categories/895539?isSubCate=true",
      product_code: code,
      corrected_product_code: code,
      model: "ASICS Gel-Kayano 14",
      colourway: item.name,
      full_colourway: item.colourway,
      colour_tags: colours.map((colour) => `colour:${colour}`).join(" | "),
      colour_confidence: "verified",
      colour_source: item.source,
    },
  }

  if (dryRun) {
    report.created.push({ code, title, handle, tags: tagValues, dry_run: true })
    console.log(`Would create ${code}: ${title} [${tagValues.join(", ")}]`)
    continue
  }

  const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,*images,*variants,*tags", {
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
