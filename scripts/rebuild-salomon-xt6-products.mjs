import fs from "node:fs/promises"

// Rebuilds the 39 Salomon XT-6 products with corrections requested after the
// first pass:
//   - Product Type = Standard Delivery
//   - Variant title/option value baked as "M {size} / W {size+1}" (matching
//     the established Nike Shox TL convention) instead of a bare number
//   - manage_inventory: false (matches "Not managed" convention)
//   - full metadata block matching the Nike Shox TL reference shape
// Reuses already-uploaded S3 image URLs (no re-upload needed) and deletes +
// recreates each product so the variant/option structure can change cleanly.

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const IMPORT_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-salomon-xt6-406490"
const RAW_ALBUMS_PATH = `${IMPORT_DIR}/raw-albums.json`
const ENV_PATH = new URL("../.image-upload.env", import.meta.url).pathname
const REPORT_PATH = `${IMPORT_DIR}/product-rebuild-report.json`

const envText = await fs.readFile(ENV_PATH, "utf8")
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter(Boolean).map((line) => {
    const index = line.indexOf("=")
    return [line.slice(0, index), line.slice(index + 1)]
  })
)
const apiKey = env.MEDUSA_ADMIN_API_KEY
const authHeaders = { Authorization: `Basic ${apiKey}` }

const BRAND_TAG = "ptag_01KT3WAPFHPDG8M6T1RQPR00B0"
const LINE_TAG = "ptag_01KT3WFPEVSYANMV1Z03E8MJ6F"
const CATEGORY_ID = "pcat_01KT3HFA42VKPWG91CVBR33XA8"
const COLLECTION_ID = "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY"
const SALES_CHANNEL_ID = "sc_01KRATS3RAF685EQT0HTDJ8BAM"
const SHIPPING_PROFILE_ID = "sp_01KRATS3PNX3RW4RVRZVRT8N3X"
const TYPE_ID = "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1" // Standard Delivery
const PRICE = 170

const COLOUR_TAGS = {
  black: "ptag_01KTK0SR51P97PKDFT8C71GB7C",
  white: "ptag_01KTK0SS4R8Q5GND0N1GYJ9M22",
  yellow: "ptag_01KTK0ST22THTSY2GEKR65PC6H",
  blue: "ptag_01KTK0SV150KKT12JSR2QZMKCD",
  red: "ptag_01KTK0SW25N1NG5KEDVZ9RJ22N",
  green: "ptag_01KTK0SX2DKV8ZQGFB1FVKM1PP",
  grey: "ptag_01KTK0SY4FX25YG2EGSCF492ZT",
  silver: "ptag_01KTK0SZ2015C5CVST8ME9TG9K",
  gold: "ptag_01KTK0T04Q64DJVCXJW8NB33H5",
  cream: "ptag_01KTK0T16H0P37V5JFZQHFTH3W",
  beige: "ptag_01KTK0T26069JENXQ0DCZ911CN",
  brown: "ptag_01KTK0T39BAKFZMGCAB2TWM79E",
  purple: "ptag_01KTK0T55T6BAQ7VXYTHXRKE9S",
  pink: "ptag_01KTK0T683H8S8P8N57HWZ15QH",
  orange: "ptag_01KTK0T77BSMSK6HKE2K6ET055",
  olive: "ptag_01KTK0T87C7GGA7E0K667BMZCQ",
  navy: "ptag_01KVPBCJHK46YSK1PS0X4HK58W",
}

const DATA = {
  "491546": { colourway: "Light Pink", confidence: "partial", source: "4feetshoes.com", colours: ["pink"] },
  "478085": { colourway: "Vanilla Ice Black Coffee", confidence: "partial", source: "KicksCrew", colours: ["cream", "brown", "black"] },
  "454564": { colourway: null, confidence: "needs review", source: "", colours: [], notes: "No colourway match found on StockX/KicksCrew/GOAT/eBay/Salomon." },
  "477377": { colourway: "Vanilla Ice Iron Etherea", confidence: "partial", source: "KicksCrew", colours: ["cream", "grey"] },
  "478739": { colourway: "Shadow Blue Nights Grisaille", confidence: "partial", source: "KicksCrew", colours: ["blue", "grey"] },
  "477376": { colourway: "Icicle Nirvana", confidence: "partial", source: "KicksCrew", colours: ["white", "silver"], notes: "Listed as a women's (WMNS) colourway on KicksCrew." },
  "492014": { colourway: "Silver Cloud Black", confidence: "partial", source: "eBay / StockX (L49201400)", colours: ["silver", "black"], notes: "Gore-Tex." },
  "478661": { colourway: "Coffee French Roast", confidence: "partial", source: "eBay", colours: ["brown"] },
  "454666": { colourway: null, confidence: "needs review", source: "", colours: [], notes: "No colourway match found on StockX/KicksCrew/GOAT/eBay/Salomon." },
  "478738": { colourway: "Shadow Gull Gray Violet Quarry", confidence: "partial", source: "Overkill", colours: ["grey", "purple"] },
  "491314": { colourway: null, confidence: "needs review", source: "", colours: [], notes: "No colourway match found on StockX/KicksCrew/GOAT/eBay/Salomon." },
  "413949": { colourway: "Blue Mood Indigo", confidence: "verified", source: "StockX", colours: ["blue", "navy"] },
  "478614": { colourway: null, confidence: "needs review", source: "", colours: [], notes: "No exact code match found. Yupoo listing shows black/pink (黑粉)." },
  "477242": { colourway: null, confidence: "needs review", source: "", colours: [], notes: "No exact code match found. Yupoo listing shows white (白)." },
  "478646": { colourway: "White Vanilla Ice Plum Perfect", confidence: "partial", source: "KicksCrew / eBay", colours: ["white", "purple"] },
  "491303": { colourway: "JJJJound Black", confidence: "partial", source: "KicksCrew", colours: ["black"], notes: "Salomon x JJJJound collaboration." },
  "477805": { colourway: "Black Asphalt Camo", confidence: "partial", source: "KicksCrew", colours: ["black", "grey"] },
  "478640": { colourway: "Grisaille Blue Nights", confidence: "partial", source: "KicksCrew", colours: ["grey", "blue"] },
  "474506": { colourway: "Black Silver", confidence: "partial", source: "KicksCrew / eBay", colours: ["black", "silver"], notes: "Gore-Tex." },
  "471366": { colourway: "Dark Sapphire", confidence: "partial", source: "KicksCrew", colours: ["blue", "navy"] },
  "474455": { colourway: "Safari", confidence: "partial", source: "KicksCrew", colours: ["beige", "brown"] },
  "413173": { colourway: "White Icy Morn", confidence: "partial", source: "KicksCrew", colours: ["white", "silver"] },
  "479531-27": { colourway: null, confidence: "needs review", source: "", colours: [], notes: "No colourway match found for 479531." },
  "474451-34": { colourway: "Plum Kitten India Ink", confidence: "partial", source: "KicksCrew", colours: ["purple", "black"] },
  "474448": { colourway: "Ghost Grey Flannel", confidence: "partial", source: "KicksCrew", colours: ["grey"] },
  "475811": { colourway: "White Footwear Silver", confidence: "partial", source: "KicksCrew", colours: ["white", "silver"] },
  "416635": { colourway: "Black Ebony", confidence: "partial", source: "KicksCrew", colours: ["black"], notes: "Gore-Tex." },
  "416722": { colourway: "Alloy Quiet Shade Black", confidence: "partial", source: "KicksCrew", colours: ["grey", "black"], notes: "Expanse." },
  "417510": { colourway: "Brown", confidence: "partial", source: "KicksCrew", colours: ["brown"] },
  "475731": { colourway: "White Metal Black", confidence: "partial", source: "KicksCrew", colours: ["white", "black"], notes: "Expanse." },
  "475908": { colourway: "Chromatic Blue Fog", confidence: "partial", source: "KicksCrew", colours: ["blue", "grey"] },
  "473058": { colourway: "Advanced Hiking Brown", confidence: "partial", source: "KicksCrew", colours: ["brown"], notes: "No specific marketed colourway name found, described only as brown." },
  "472885": { colourway: "Beige White Blue", confidence: "partial", source: "KicksCrew", colours: ["beige", "white", "blue"], notes: "Expanse." },
  "417413": { colourway: "Expanse Triple Black", confidence: "partial", source: "KicksCrew", colours: ["black"], notes: "Expanse. Distinct SKU from 410866, also 'Triple Black'." },
  "417414": { colourway: "Vanilla Ice Alloy", confidence: "partial", source: "KicksCrew", colours: ["cream", "grey"], notes: "Expanse." },
  "473057": { colourway: "Monument Phantom", confidence: "partial", source: "KicksCrew", colours: ["grey", "blue"], notes: "KicksCrew lists this SKU as a Salomon RECUT, not XT-6. Imported as XT-6 per Yupoo category placement." },
  "414551": { colourway: "Blue", confidence: "partial", source: "KicksCrew", colours: ["blue"] },
  "410866": { colourway: "Triple Black", confidence: "partial", source: "KicksCrew", colours: ["black"], notes: "Distinct SKU from 417413, also 'Triple Black'." },
  "412529": { colourway: "White", confidence: "partial", source: "KicksCrew", colours: ["white"] },
}

const CATEGORY_URL = "https://yolo66.x.yupoo.com/categories/406490?isSubCate=true"
const SIZES = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5"]
const sizeLabel = (size) => `M ${size} / W ${Number(size) + 1}`

const slugify = (value) => String(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, "content-type": "application/json", ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 800)}`)
  }
  return body
}

const albums = JSON.parse(await fs.readFile(RAW_ALBUMS_PATH, "utf8"))
const albumsByCode = new Map(albums.map((a) => [a.product_code, a]))

const existing = []
for (let offset = 0; offset < 200; offset += 100) {
  const response = await adminFetch(`/admin/products?limit=100&offset=${offset}&q=Salomon&fields=id,external_id,*images`)
  existing.push(...(response.products || []))
  if ((response.products || []).length < 100) break
}
console.log(`Found ${existing.length} existing Salomon products to rebuild`)

const usedHandles = new Set()
const DISPLAY_NAME_OVERRIDE = {}

const report = { started_at: new Date().toISOString(), deleted: [], created: [], failed: [] }

for (const product of existing) {
  const code = product.external_id.replace("yupoo-salomon-xt6-", "")
  const album = albumsByCode.get(code)
  const info = DATA[code]
  if (!album || !info) {
    console.error(`Skipping ${code}: missing album or DATA entry`)
    continue
  }

  const needsReview = info.colourway === null
  const displayName = info.colourway
  const productTitle = needsReview ? `Salomon XT-6 - ${code}` : `Salomon XT-6 - ${displayName}`
  let handle = slugify(needsReview ? `salomon-xt-6-${code}` : `salomon-xt-6-${displayName}`)
  const base = handle
  let n = 2
  while (usedHandles.has(handle)) {
    handle = `${base}-${code.toLowerCase()}`
    if (usedHandles.has(handle)) handle = `${base}-${code.toLowerCase()}-${n++}`
  }
  usedHandles.add(handle)

  const description = needsReview
    ? `The Salomon XT-6 (style ${code}) brings trail-running performance to the street with its low-profile Agile Chassis System midsole, breathable Sensifit upper, and grippy Mud Contagrip outsole.\n\nColourway name is pending verification for this style — message @muse.nz for extra photos before ordering.\n\nTrue to size for most buyers. See the size guide for full Men's/Women's/EU/CM/UK conversions.`
    : `The Salomon XT-6 ${displayName} brings trail-running performance to the street with its low-profile Agile Chassis System midsole, breathable Sensifit upper, and grippy Mud Contagrip outsole.\n\nOriginally built for ultra-distance trail running, the XT-6 has become one of the defining silhouettes of the current outdoor-to-street movement, prized for its lightweight cushioning and technical detailing.\n\nThe ${displayName} colourway pairs technical materials with a wearable everyday palette, finished with the toggle Quicklace closure for a secure, laceless-look fit.\n\nTrue to size for most buyers. See the size guide for full Men's/Women's/EU/CM/UK conversions.`

  const colourTagIds = (info.colours || []).map((c) => COLOUR_TAGS[c]).filter(Boolean)
  const tags = [{ id: BRAND_TAG }, { id: LINE_TAG }, ...colourTagIds.map((id) => ({ id }))]

  const metadata = {
    brand: "Salomon",
    model: "Salomon XT-6",
    source: "yupoo",
    colourway: displayName || "",
    full_colourway: displayName || "",
    source_url: album.source_url,
    source_title: album.source_title,
    source_category: CATEGORY_URL,
    product_code: code,
    corrected_product_code: code,
    colour_tags: (info.colours || []).map((c) => `colour:${c}`).join(" | "),
    colour_source: info.source || "",
    colour_confidence: info.confidence,
    size_display_note: "Sizes are shown as US Men's / US Women's.",
    source_size_system: "eu",
    display_size_system: "salomon-us",
    ...(info.notes ? { notes: info.notes } : {}),
  }

  const imageUrls = (product.images || []).map((img) => img.url)

  const payload = {
    title: productTitle,
    handle,
    subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
    description,
    status: "published",
    type_id: TYPE_ID,
    weight: 900,
    shipping_profile_id: SHIPPING_PROFILE_ID,
    sales_channels: [{ id: SALES_CHANNEL_ID }],
    collection_id: COLLECTION_ID,
    categories: [{ id: CATEGORY_ID }],
    tags,
    external_id: product.external_id,
    discountable: true,
    metadata,
    images: imageUrls.map((url) => ({ url })),
    thumbnail: imageUrls[0],
    options: [{ title: "Size", values: SIZES.map(sizeLabel) }],
    variants: SIZES.map((size) => ({
      title: sizeLabel(size),
      sku: `SALOMON-XT6-${code}-${size}`,
      manage_inventory: false,
      allow_backorder: false,
      options: { Size: sizeLabel(size) },
      prices: [
        { currency_code: "nzd", amount: PRICE },
        { currency_code: "eur", amount: PRICE },
        { currency_code: "usd", amount: PRICE },
      ],
    })),
  }

  try {
    await adminFetch(`/admin/products/${product.id}`, { method: "DELETE" })
    report.deleted.push(product.id)
    const result = await adminFetch("/admin/products", { method: "POST", body: JSON.stringify(payload) })
    console.log(`Rebuilt ${code}: ${handle} -> ${result.product.id}`)
    report.created.push({ code, handle, id: result.product.id })
  } catch (error) {
    console.error(`FAILED ${code}: ${error.message}`)
    report.failed.push({ code, error: error.message })
  }

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
}

report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Deleted: ${report.deleted.length}, Created: ${report.created.length}, Failed: ${report.failed.length}`)
