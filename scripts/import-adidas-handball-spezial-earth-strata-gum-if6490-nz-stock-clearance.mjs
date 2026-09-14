import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/adidas-handball-spezial-earth-strata-gum-if6490-nz-stock-clearance-report.json"
const SOURCE_PRODUCT_ID = "prod_01KVFN96H09PZ4T61XRBZPZ6NQ"

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
  brandTag: "ptag_01KT3WBRDX9BKXXZAH7F7W5QSK",
  modelTag: "ptag_01KVFN93GDDTFFP72MX2Q3T1P5",
  brownTag: "ptag_01KTK0T39BAKFZMGCAB2TWM79E",
  whiteTag: "ptag_01KTK0SS4R8Q5GND0N1GYJ9M22",
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

const TITLE = "adidas Handball Spezial - Earth Strata Gum"
const HANDLE = "adidas-handball-spezial-earth-strata-gum-if6490-nz-stock-clearance"
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-ADIDAS-HANDBALL-SPEZIAL-IF6490-EARTH-STRATA-GUM"
const STYLE_CODE = "IF6490"
const PRICE = 100
const STOCK_MENS_SIZES = new Set(["7", "8"])
const DESCRIPTION = `The adidas Handball Spezial Earth Strata Gum brings archival terrace style to a warm neutral palette, combining an Earth Strata suede upper with Off White serrated 3-Stripes and a classic Gum rubber sole.

The low-profile silhouette features a reinforced suede toe, lace closure, gold Spezial branding and patterned rubber traction underfoot.

This pair is NZ Stock in men's sizes 7 and 8, displayed as M 7 / W 8.5 and M 8 / W 9.5 using the MUSE adidas size chart. The box is damaged. It is priced as Clearance and is final sale - no refunds or exchanges.`

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

const existingBody = await adminFetch(`/admin/products?limit=20&q=${encodeURIComponent(HANDLE)}&fields=id,title,handle,external_id`)
const existing = (existingBody.products || []).find((p) => p.handle === HANDLE || p.external_id === EXTERNAL_ID)
if (existing) {
  console.log(`Skipped existing product: ${existing.id} ${existing.title}`)
  await fs.writeFile(REPORT_PATH, JSON.stringify({ skipped: true, existing }, null, 2))
  process.exit(0)
}

const { product: source } = await adminFetch(`/admin/products/${SOURCE_PRODUCT_ID}?fields=id,title,handle,status,thumbnail,*images,metadata`)
if (source.handle !== "adidas-handball-spezial-earth-strata-gum" || source.metadata?.product_code !== STYLE_CODE) {
  throw new Error("Source product identity assertion failed")
}
const imageUrls = (source.images || []).map((image) => image.url)
if (imageUrls.length !== 11) throw new Error(`Expected 11 source images; found ${imageUrls.length}`)

const clearanceTag = await ensureTag("clearance")
const tagIds = [IDS.brandTag, IDS.modelTag, IDS.brownTag, IDS.whiteTag, IDS.gumTag, IDS.saleTag, clearanceTag.id]

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Would create ${TITLE} with ${SIZE_ROWS.length} Adidas sizes; only M 7 / W 8.5 and M 8 / W 9.5 have stock 1.`)
if (dryRun) {
  await fs.writeFile(REPORT_PATH, JSON.stringify({
    dry_run: true, title: TITLE, handle: HANDLE, style_code: STYLE_CODE, price_nzd: PRICE,
    size_rows: SIZE_ROWS, stocked_mens_sizes: [...STOCK_MENS_SIZES], image_urls: imageUrls,
    source_product_id: source.id, source_handle: source.handle, tag_ids: tagIds,
  }, null, 2))
  process.exit(0)
}

const payload = {
  title: TITLE,
  subtitle: "Clearance - NZ Stock - Men's 7 & 8 - Damaged Box - Final Sale",
  handle: HANDLE,
  description: DESCRIPTION,
  status: "published",
  discountable: false,
  weight: 400,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZE_ROWS.map((row) => row.display) }],
  variants: SIZE_ROWS.map((row) => {
    const stocked = STOCK_MENS_SIZES.has(row.men)
    return {
      title: row.display,
      sku: `MUSE-ADIDAS-HANDBALL-SPEZIAL-${STYLE_CODE}-CLEARANCE-${row.eu}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
      allow_backorder: false,
      manage_inventory: true,
      weight: 400,
      options: { Size: row.display },
      prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })),
      metadata: {
        brand: "adidas", model: "Handball Spezial", eu_size: row.eu, source_eu_size: row.eu,
        us_mens_size: row.men, us_womens_size: row.women, uk_size: row.uk, cm_jp_size: row.cm,
        display_size: row.display, size_system: "adidas-us-men-women", source_size_system: "eu",
        nz_stock_quantity: stocked ? "1" : "0",
        availability_note: stocked ? "NZ stock - clearance, single unit" : "Out of stock",
      },
    }
  }),
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  categories: [{ id: IDS.category }],
  type_id: IDS.productType,
  tags: tagIds.map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock", stock_source: "nz_stock", brand: "adidas", model: "adidas Handball Spezial",
    product_code: STYLE_CODE, style_code: STYLE_CODE, colourway: "Earth Strata/Off White/Gum",
    full_colourway: "Earth Strata / Off White / Gum", colour_tags: "colour:brown | colour:white | colour:gum",
    colour_confidence: "verified", colour_source: "Existing MUSE listing and StockX",
    stockx_url: "https://stockx.com/adidas-handball-spezial-earth-strata-gum-womens",
    source_product_id: source.id, source_product_handle: source.handle,
    size_chart: "adidas-adult-us-men-women", size_display_note: "Sizes are shown as US Men's / US Women's.",
    source_size_system: "eu", display_size_system: "adidas-us-men-women", size_display_format: "US Men / US Women",
    requested_size_note: "User requested men's 7 and men's 8; displayed as M 7 / W 8.5 (EU40) and M 8 / W 9.5 (EU41).",
    image_source: "reused from existing MUSE Earth Strata Gum listing", is_clearance: "true",
    return_policy: "final_sale_no_refunds", condition_note: "Damaged box", packaging_condition: "damaged_box",
    clearance_price_nzd: String(PRICE),
    seo_title: "adidas Handball Spezial Earth Strata Gum IF6490 | Clearance NZ Stock | MUSE",
    meta_description: "Clearance adidas Handball Spezial Earth Strata Gum IF6490 in NZ Stock, men's sizes 7 and 8. $100 damaged-box final sale.",
  },
}

const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,status,discountable,thumbnail,*images,*variants,*variants.inventory_items,*variants.options,*variants.prices,*tags,*categories,*collection,*type,metadata", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
})
const product = created.product
for (const variant of product.variants || []) {
  const row = SIZE_ROWS.find(({ display }) => display === variant.title)
  const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
  if (!row || !itemId) throw new Error(`${product.id}/${variant.id}: missing size row or inventory item`)
  await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ location_id: IDS.aucklandLocation, stocked_quantity: STOCK_MENS_SIZES.has(row.men) ? 1 : 0 }),
  })
}

const { product: verified } = await adminFetch(`/admin/products/${product.id}?fields=id,title,handle,external_id,status,discountable,thumbnail,*images,*variants,*variants.inventory_items,*variants.options,*variants.prices,*tags,*categories,*collection,*type,metadata`)
const stockedVariants = verified.variants.filter((variant) => STOCK_MENS_SIZES.has(variant.metadata?.us_mens_size))
if (verified.status !== "published" || verified.discountable !== false || verified.images.length !== 11 || verified.variants.length !== 15 || stockedVariants.length !== 2) {
  throw new Error("Admin read-back assertion failed")
}
const report = {
  created_at: new Date().toISOString(), product_id: verified.id, title: verified.title, handle: verified.handle,
  status: verified.status, discountable: verified.discountable, image_count: verified.images.length,
  image_urls: verified.images.map((image) => image.url), variant_count: verified.variants.length,
  stocked_variants: stockedVariants.map((variant) => ({ id: variant.id, title: variant.title, metadata: variant.metadata })),
  collection: verified.collection, type: verified.type, categories: verified.categories,
  tags: verified.tags.map((tag) => tag.value), metadata: verified.metadata,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created ${verified.id}: ${verified.title} [${verified.status}]`)
console.log(`Images: ${verified.images.length}; variants: ${verified.variants.length}; stocked: ${stockedVariants.map((v) => v.title).join(", ")}`)
console.log(`Report: ${REPORT_PATH}`)
