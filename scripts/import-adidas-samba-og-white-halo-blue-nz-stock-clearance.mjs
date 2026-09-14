import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/adidas-samba-og-white-halo-blue-nz-stock-clearance-report.json"
const IMAGE_PATHS = [
  "imgi_2_643508763_2387972628331014_2982006633222621678_n.jpg",
  "imgi_3_639579319_1355835512967373_2973568815208740228_n.jpg",
  "imgi_4_628988226_1199648971959443_8751400395042745323_n.jpg",
  "imgi_5_641510261_1628483638275515_7164442266797090037_n.jpg",
  "imgi_6_641043777_1965739411018550_6784072904147389909_n.jpg",
  "imgi_7_642711370_1234796605458862_7097902639223415044_n.jpg",
  "imgi_8_640879685_1748271526374366_4014392091952225833_n.jpg",
  "imgi_9_641490016_1975062696741708_4706720195041624751_n.jpg",
  "imgi_10_641471641_1919882348607980_2078427919241265835_n.jpg",
].map((name) => `/Users/mrburns_mac/Downloads/(2) Marketplace - Adidas Samba (5 womans) baby blue _ Facebook/${name}`)

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WBRDX9BKXXZAH7F7W5QSK",
  modelTag: "ptag_01KVFN97A4V0VHK9D61ZAMYVBN",
  whiteTag: "ptag_01KTK0SS4R8Q5GND0N1GYJ9M22",
  blueTag: "ptag_01KTK0SV150KKT12JSR2QZMKCD",
  gumTag: "ptag_01KVFN8X459D6SSAEKFC7D3YY0",
  saleTag: "ptag_01KT3W19BT07ANEQBF425WT73N",
}

const SIZE_ROWS = [
  ["35.5", "3.5", "5", "3", "22"], ["36", "4", "5.5", "3.5", "22.5"],
  ["36.5", "4.5", "6", "4", "23"], ["37", "5", "6.5", "4.5", "23.5"],
  ["38", "5.5", "7", "5", "24"], ["38.5", "6", "7.5", "5.5", "24.5"],
  ["39", "6.5", "8", "6", "25"], ["40", "7", "8.5", "6.5", "25.5"],
  ["40.5", "7.5", "9", "7", "26"], ["41", "8", "9.5", "7.5", "26.5"],
  ["42", "8.5", "10", "8", "27"], ["42.5", "9", "10.5", "8.5", "27.5"],
  ["43", "9.5", "11", "9", "28"], ["44", "10", "11.5", "9.5", "28.5"],
  ["45", "11", "12.5", "10.5", "29"],
].map(([eu, men, women, uk, cm]) => ({ eu, men, women, uk, cm, display: `M ${men} / W ${women}` }))

const TITLE = "adidas Samba OG - White Halo Blue"
const HANDLE = "adidas-samba-og-white-halo-blue-id2055-nz-stock-clearance"
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-ADIDAS-SAMBA-OG-ID2055-WHITE-HALO-BLUE"
const STYLE_CODE = "ID2055"
const PRICE = 90
const STOCK_EU_SIZE = "36"
const DESCRIPTION = `The adidas Samba OG White Halo Blue updates the classic low-profile Samba with a clean Core White leather upper, pale Halo Blue serrated 3-Stripes and heel tab, and a dark Gum 5 rubber outsole.

The signature T-toe suede overlay adds texture and reinforcement, while the lace closure and streamlined profile retain the football-inspired Samba OG shape.

This pair is NZ Stock in the physically labelled US 4 / UK 3.5 / EU 36 size, displayed as M 4 / W 5.5 using the MUSE adidas size chart. It is priced as Clearance and is final sale - no refunds or exchanges.`

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }
const dryRun = process.argv.includes("--dry-run")

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body
}

const ensureTag = async (value) => {
  const body = await adminFetch("/admin/product-tags?limit=300")
  const existing = (body.product_tags || body.tags || []).find((tag) => tag.value === value)
  if (existing) return existing
  if (dryRun) return { id: `dry-${value}`, value }
  const created = await adminFetch("/admin/product-tags", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }),
  })
  return created.product_tag || created.tag
}

const uploadFile = async (filePath) => {
  const data = await fs.readFile(filePath)
  const form = new FormData()
  form.append("files", new File([data], path.basename(filePath), { type: "image/jpeg" }))
  const response = await fetch(`${BACKEND_URL}/admin/uploads`, {
    method: "POST", headers: authHeaders, body: form, signal: AbortSignal.timeout(30000),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body.files[0]
}

const existingBody = await adminFetch(`/admin/products?limit=20&q=${STYLE_CODE}&fields=id,title,handle,external_id,metadata`)
const existing = (existingBody.products || []).find((p) => p.handle === HANDLE || p.external_id === EXTERNAL_ID || p.metadata?.product_code === STYLE_CODE)
if (existing) {
  console.log(`Skipped existing product: ${existing.id} ${existing.title}`)
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

for (const imagePath of IMAGE_PATHS) await fs.access(imagePath)
const clearanceTag = await ensureTag("clearance")
const tagIds = [IDS.brandTag, IDS.modelTag, IDS.whiteTag, IDS.blueTag, IDS.gumTag, IDS.saleTag, clearanceTag.id]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} with ${SIZE_ROWS.length} Adidas sizes; only M 4 / W 5.5 (physical label US 4 / EU 36) has stock 1.`)
if (dryRun) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({ dry_run: true, title: TITLE, handle: HANDLE, style_code: STYLE_CODE, price_nzd: PRICE, size_rows: SIZE_ROWS, stock_eu_size: STOCK_EU_SIZE, image_paths: IMAGE_PATHS, tag_ids: tagIds }, null, 2))
  process.exit(0)
}

const files = []
for (const filePath of IMAGE_PATHS) files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
const imageUrls = files.map((file) => file.url)
const payload = {
  title: TITLE,
  subtitle: "Clearance - NZ Stock - US 4 / EU 36 - Final Sale",
  handle: HANDLE,
  description: DESCRIPTION,
  status: "published",
  discountable: false,
  weight: 400,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZE_ROWS.map((row) => row.display) }],
  variants: SIZE_ROWS.map((row) => ({
    title: row.display,
    sku: `MUSE-ADIDAS-SAMBA-${STYLE_CODE}-${row.eu}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: false,
    manage_inventory: true,
    weight: 400,
    options: { Size: row.display },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
    metadata: {
      brand: "adidas", model: "Samba OG", eu_size: row.eu, source_eu_size: row.eu,
      us_mens_size: row.men, us_womens_size: row.women, uk_size: row.uk, cm_jp_size: row.cm,
      display_size: row.display, size_system: "adidas-us-men-women", source_size_system: "eu",
      nz_stock_quantity: row.eu === STOCK_EU_SIZE ? "1" : "0",
      availability_note: row.eu === STOCK_EU_SIZE ? "NZ stock - clearance, single unit" : "Out of stock",
    },
  })),
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  categories: [{ id: IDS.category }],
  type_id: IDS.productType,
  tags: tagIds.map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock", stock_source: "nz_stock", brand: "adidas", model: "adidas Samba OG",
    product_code: STYLE_CODE, style_code: STYLE_CODE, colourway: "Core White/Halo Blue/Gum 5",
    full_colourway: "Core White / Halo Blue / Gum 5", colour_tags: "colour:white | colour:blue | colour:gum",
    colour_confidence: "verified", colour_source: "StockX and adidas; product code visible on customer-supplied tongue label",
    stockx_url: "https://stockx.com/adidas-samba-og-white-halo-blue", size_chart: "adidas-adult-us-men-women",
    size_display_note: "Sizes are shown as US Men's / US Women's.", source_size_system: "eu",
    display_size_system: "adidas-us-men-women", size_display_format: "US Men / US Women",
    physical_size_label: "US 4 / UK 3.5 / EU 36 / JP 220 / CHN 220", requested_size_note: "User described pair as Women's US 5; physical label is US 4 / EU 36, which maps to M 4 / W 5.5 in the established MUSE adidas chart.",
    image_source: "customer-supplied Marketplace photos", is_clearance: "true", return_policy: "final_sale_no_refunds",
    clearance_price_nzd: String(PRICE),
    seo_title: "adidas Samba OG White Halo Blue ID2055 | Clearance NZ Stock | MUSE",
    meta_description: "Clearance adidas Samba OG White Halo Blue ID2055 in NZ Stock, labelled US 4 / EU 36. Core White, Halo Blue and dark gum sole. $90 final sale.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*variants.options,*variants.prices,*tags,*categories,*collection,*type,metadata", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
})
const product = created.product
for (const variant of product.variants || []) {
  const row = SIZE_ROWS.find(({ display }) => display === variant.title)
  const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
  if (!row || !itemId) throw new Error(`${product.id}/${variant.id}: missing size row or inventory item`)
  await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ location_id: IDS.aucklandLocation, stocked_quantity: row.eu === STOCK_EU_SIZE ? 1 : 0 }),
  })
}

const { product: verified } = await adminFetch(`/admin/products/${product.id}?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*variants.options,*variants.prices,*tags,*categories,*collection,*type,metadata`)
const stockedVariant = verified.variants.find((variant) => variant.metadata?.eu_size === STOCK_EU_SIZE)
if (verified.status !== "published" || verified.images.length !== 9 || verified.variants.length !== 15 || stockedVariant?.title !== "M 4 / W 5.5") throw new Error("Admin read-back assertion failed")
const report = {
  created_at: new Date().toISOString(), product_id: verified.id, title: verified.title, handle: verified.handle,
  status: verified.status, image_count: verified.images.length, variant_count: verified.variants.length,
  stocked_variant: { id: stockedVariant.id, title: stockedVariant.title, metadata: stockedVariant.metadata },
  collection: verified.collection, type: verified.type, categories: verified.categories,
  tags: verified.tags.map((tag) => tag.value), metadata: verified.metadata, files,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${verified.id}: ${verified.title} [${verified.status}]`)
console.log(`Images: ${verified.images.length}; variants: ${verified.variants.length}; stocked: ${stockedVariant.title}`)
console.log(`Report: ${REPORT_PATH}`)
