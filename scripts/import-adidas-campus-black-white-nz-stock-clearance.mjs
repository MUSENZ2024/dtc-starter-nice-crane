import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/adidas-campus-black-white-nz-stock-clearance-report.json"

const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/(2) Marketplace - Adidas Campus (EU 38) _ Facebook/imgi_2_657473963_1455927505941207_3520558441857473382_n.jpg",
  "/Users/mrburns_mac/Downloads/(2) Marketplace - Adidas Campus (EU 38) _ Facebook/imgi_3_656901869_912079918274043_7138565070334715955_n.jpg",
  "/Users/mrburns_mac/Downloads/(2) Marketplace - Adidas Campus (EU 38) _ Facebook/imgi_4_658165326_775562948681840_3244967055089978609_n.jpg",
  "/Users/mrburns_mac/Downloads/(2) Marketplace - Adidas Campus (EU 38) _ Facebook/imgi_5_659054952_1732110921528891_5392127287879339414_n.jpg",
  "/Users/mrburns_mac/Downloads/(2) Marketplace - Adidas Campus (EU 38) _ Facebook/imgi_6_658361166_971005535489601_3906610066183816163_n.jpg",
  "/Users/mrburns_mac/Downloads/(2) Marketplace - Adidas Campus (EU 38) _ Facebook/imgi_7_656229157_1254786052844169_5257873648748604169_n.jpg",
  "/Users/mrburns_mac/Downloads/(2) Marketplace - Adidas Campus (EU 38) _ Facebook/imgi_8_658224019_945415264631712_1977378894735757891_n.jpg",
]

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM", // NZ Stock
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN", // NZ Stock
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8", // Sneakers
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WBRDX9BKXXZAH7F7W5QSK", // adidas
  blackTag: "ptag_01KTK0SR51P97PKDFT8C71GB7C", // colour:black
  whiteTag: "ptag_01KTK0SS4R8Q5GND0N1GYJ9M22", // colour:white
  creamTag: "ptag_01KTK0T16H0P37V5JFZQHFTH3W", // colour:cream
  saleTag: "ptag_01KT3W19BT07ANEQBF425WT73N", // sale
}

const SIZE_ROWS = [
  { eu: "35.5", men: "3.5", women: "5", uk: "3", cm: "22" },
  { eu: "36", men: "4", women: "5.5", uk: "3.5", cm: "22.5" },
  { eu: "36.5", men: "4.5", women: "6", uk: "4", cm: "23" },
  { eu: "37", men: "5", women: "6.5", uk: "4.5", cm: "23.5" },
  { eu: "38", men: "5.5", women: "7", uk: "5", cm: "24" },
  { eu: "38.5", men: "6", women: "7.5", uk: "5.5", cm: "24.5" },
  { eu: "39", men: "6.5", women: "8", uk: "6", cm: "25" },
  { eu: "40", men: "7", women: "8.5", uk: "6.5", cm: "25.5" },
  { eu: "40.5", men: "7.5", women: "9", uk: "7", cm: "26" },
  { eu: "41", men: "8", women: "9.5", uk: "7.5", cm: "26.5" },
  { eu: "42", men: "8.5", women: "10", uk: "8", cm: "27" },
  { eu: "42.5", men: "9", women: "10.5", uk: "8.5", cm: "27.5" },
  { eu: "43", men: "9.5", women: "11", uk: "9", cm: "28" },
  { eu: "44", men: "10", women: "11.5", uk: "9.5", cm: "28.5" },
  { eu: "45", men: "11", women: "12.5", uk: "10.5", cm: "29" },
].map((row) => ({ ...row, display: `M ${row.men} / W ${row.women}` }))

const TITLE = "adidas Campus - Black White"
const HANDLE = "adidas-campus-black-white-bz0084-nz-stock-clearance"
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-ADIDAS-CAMPUS-BZ0084-BLACK-WHITE"
const STYLE_CODE = "BZ0084"
const PRICE = 90
const STOCK_EU_SIZE = "38"

const DESCRIPTION = `The adidas Campus Black White keeps the classic low-profile Campus shape in a versatile black and white finish. The black nubuck upper is contrasted by serrated white 3-Stripes, a white heel tab, and a chalk-white rubber sole.

Originally rooted in basketball and later adopted across skate and streetwear culture, the Campus is finished with a reinforced toe, lace closure, and adidas Originals branding.

This pair is NZ Stock in EU 38 / US Women's 7 and is priced as Clearance. This is final sale clearance stock - no refunds or exchanges.`

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
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  }
  return body
}

const ensureTag = async (value) => {
  const body = await adminFetch("/admin/product-tags?limit=300")
  const tags = body.product_tags || body.tags || []
  const existing = tags.find((tag) => tag.value === value)
  if (existing) return existing
  if (dryRun) return { id: `dry-${value}`, value }
  const created = await adminFetch("/admin/product-tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value }),
  })
  return created.product_tag || created.tag
}

const uploadFile = async (filePath) => {
  const data = await fs.readFile(filePath)
  const form = new FormData()
  form.append("files", new File([data], path.basename(filePath), { type: "image/jpeg" }))
  const response = await fetch(`${BACKEND_URL}/admin/uploads`, {
    method: "POST",
    headers: authHeaders,
    body: form,
    signal: AbortSignal.timeout(30000),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body.files[0]
}

const existingBody = await adminFetch(`/admin/products?limit=20&q=${encodeURIComponent(STYLE_CODE)}&fields=id,title,handle,external_id,metadata`)
const existing = (existingBody.products || []).find(
  (product) => product.handle === HANDLE || product.external_id === EXTERNAL_ID || product.metadata?.product_code === STYLE_CODE
)
if (existing) {
  console.log(`Skipped existing product: ${existing.id} ${existing.title}`)
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

for (const imagePath of IMAGE_PATHS) await fs.access(imagePath)
const modelTag = await ensureTag("adidas-campus")
const clearanceTag = await ensureTag("clearance")
const tagIds = [IDS.brandTag, modelTag.id, IDS.blackTag, IDS.whiteTag, IDS.creamTag, IDS.saleTag, clearanceTag.id]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} with ${SIZE_ROWS.length} Adidas US Men/Women sizes; only M 5.5 / W 7 (EU 38) has stock 1.`)

if (dryRun) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({
    dry_run: true,
    title: TITLE,
    handle: HANDLE,
    style_code: STYLE_CODE,
    price_nzd: PRICE,
    size_rows: SIZE_ROWS,
    stock_eu_size: STOCK_EU_SIZE,
    image_paths: IMAGE_PATHS,
    tag_ids: tagIds,
  }, null, 2))
  process.exit(0)
}

const files = []
for (const filePath of IMAGE_PATHS) files.push({ local_path: filePath, ...(await uploadFile(filePath)) })
const imageUrls = files.map((file) => file.url)

const payload = {
  title: TITLE,
  subtitle: "Clearance - NZ Stock - Women's US 7 / EU 38 - Final Sale",
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
    sku: `MUSE-ADIDAS-CAMPUS-${STYLE_CODE}-${row.eu}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
    allow_backorder: false,
    manage_inventory: true,
    weight: 400,
    options: { Size: row.display },
    prices: [
      { currency_code: "nzd", amount: PRICE },
      { currency_code: "usd", amount: PRICE },
      { currency_code: "eur", amount: PRICE },
    ],
    metadata: {
      brand: "adidas",
      model: "Campus",
      eu_size: row.eu,
      source_eu_size: row.eu,
      us_mens_size: row.men,
      us_womens_size: row.women,
      uk_size: row.uk,
      cm_jp_size: row.cm,
      display_size: row.display,
      size_system: "adidas-us-men-women",
      source_size_system: "eu",
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
    source: "local_nz_stock",
    stock_source: "nz_stock",
    brand: "adidas",
    model: "adidas Campus",
    product_code: STYLE_CODE,
    style_code: STYLE_CODE,
    colourway: "Core Black/Running White/Chalk White",
    full_colourway: "Core Black / Running White / Chalk White",
    colour_tags: "colour:black | colour:white | colour:cream",
    colour_confidence: "verified",
    colour_source: "StockX; matched against customer-supplied photos",
    stockx_url: "https://stockx.com/adidas-campus-black-white",
    size_chart: "adidas-adult-us-men-women",
    size_display_note: "Sizes are shown as US Men's / US Women's.",
    source_size_system: "eu",
    display_size_system: "adidas-us-men-women",
    size_display_format: "US Men / US Women",
    image_source: "customer-supplied Marketplace photos",
    is_clearance: "true",
    return_policy: "final_sale_no_refunds",
    clearance_price_nzd: String(PRICE),
    seo_title: "adidas Campus Black White BZ0084 | Clearance NZ Stock | MUSE",
    meta_description: "Clearance adidas Campus Black White BZ0084 in NZ Stock, Women's US 7 / EU 38. Core Black, white stripes and chalk-white sole. $90 final sale.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*variants.options,*variants.prices,*tags,*categories,*collection,*type,metadata", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
})
const product = created.product

for (const variant of product.variants || []) {
  const row = SIZE_ROWS.find(({ display }) => display === variant.title)
  const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
  if (!row || !itemId) throw new Error(`${product.id}/${variant.id}: missing size row or inventory item`)
  await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ location_id: IDS.aucklandLocation, stocked_quantity: row.eu === STOCK_EU_SIZE ? 1 : 0 }),
  })
}

const verified = await adminFetch(`/admin/products/${product.id}?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*variants.options,*variants.prices,*tags,*categories,*collection,*type,metadata`)
const verifiedProduct = verified.product
const stockedVariant = verifiedProduct.variants.find((variant) => variant.metadata?.eu_size === STOCK_EU_SIZE)
if (verifiedProduct.status !== "published" || verifiedProduct.images.length !== IMAGE_PATHS.length || verifiedProduct.variants.length !== SIZE_ROWS.length) {
  throw new Error("Admin read-back failed product status, image count, or variant count assertion")
}
if (stockedVariant?.title !== "M 5.5 / W 7") throw new Error("Admin read-back failed stocked size mapping assertion")

const report = {
  created_at: new Date().toISOString(),
  product_id: verifiedProduct.id,
  title: verifiedProduct.title,
  handle: verifiedProduct.handle,
  external_id: verifiedProduct.external_id,
  status: verifiedProduct.status,
  image_count: verifiedProduct.images.length,
  variant_count: verifiedProduct.variants.length,
  stocked_variant: { id: stockedVariant.id, title: stockedVariant.title, metadata: stockedVariant.metadata },
  collection: verifiedProduct.collection,
  type: verifiedProduct.type,
  categories: verifiedProduct.categories,
  tags: verifiedProduct.tags.map((tag) => tag.value),
  metadata: verifiedProduct.metadata,
  files,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${verifiedProduct.id}: ${verifiedProduct.title} [${verifiedProduct.status}]`)
console.log(`Images: ${verifiedProduct.images.length}; variants: ${verifiedProduct.variants.length}; stocked: ${stockedVariant.title}`)
console.log(`Report: ${REPORT_PATH}`)
