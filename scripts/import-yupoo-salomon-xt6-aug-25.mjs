import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const IMPORT_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-salomon-xt6-aug-25"
const ENV_PATH = new URL("../.image-upload.env", import.meta.url).pathname
const REPORT_PATH = path.join(IMPORT_DIR, "import-report.json")
const dryRun = !process.argv.includes("--apply")
const sizesOnly = process.argv.includes("--sizes-only")

const envText = await fs.readFile(ENV_PATH, "utf8")
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => {
  const index = line.indexOf("=")
  return [line.slice(0, index), line.slice(index + 1)]
}))
if (!env.MEDUSA_ADMIN_API_KEY?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${env.MEDUSA_ADMIN_API_KEY}` }

const BRAND_TAG = "ptag_01KT3WAPFHPDG8M6T1RQPR00B0"
const LINE_TAG = "ptag_01KT3WFPEVSYANMV1Z03E8MJ6F"
const COLOUR_TAGS = {
  cream: "ptag_01KTK0T16H0P37V5JFZQHFTH3W",
  beige: "ptag_01KTK0T26069JENXQ0DCZ911CN",
  brown: "ptag_01KTK0T39BAKFZMGCAB2TWM79E",
  green: "ptag_01KTK0SX2DKV8ZQGFB1FVKM1PP",
}
const CATEGORY_ID = "pcat_01KT3HFA42VKPWG91CVBR33XA8"
const COLLECTION_ID = "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY"
const SALES_CHANNEL_ID = "sc_01KRATS3RAF685EQT0HTDJ8BAM"
const SHIPPING_PROFILE_ID = "sp_01KRATS3PNX3RW4RVRZVRT8N3X"
const TYPE_ID = "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1"
const PRICE = 170
const MEN_SIZES = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5"]
const sizeLabel = (size) => `M ${size} / W ${Number(size) + 1.5}`

const PRODUCTS = [
  {
    code: "475822",
    model: "Salomon XT-6",
    title: "Salomon XT-6 - Almond Milk Portabella",
    handle: "salomon-xt-6-almond-milk-portabella",
    colourway: "Almond Milk Portabella",
    fullColourway: "Almond Milk/Portabella/Ice Flow",
    colours: ["cream", "brown"],
    stockxUrl: "https://stockx.com/salomon-xt-6-almond-milk-portabella",
    sourceUrl: "https://yolo66.x.yupoo.com/albums/209908940?uid=1&isSubCate=true&referrercate=406486",
    sourceTitle: "280Y【绿X/GX Batch】 XT-6（36-46.5）475822 26白棕",
    duplicateAlbum: "https://yolo66.x.yupoo.com/albums/239112193?uid=1&isSubCate=true&referrercate=766544",
    imageKeys: ["1a54f9b5", "9f402f5b", "d8766c08", "2016f144", "7b3cdb70", "c61644cd", "51431748", "04836e04"],
  },
  {
    code: "473058",
    model: "Salomon XT-6 RECUT",
    title: "Salomon XT-6 RECUT - Wren Kangaroo",
    handle: "salomon-xt-6-recut-wren-kangaroo",
    colourway: "Wren Kangaroo",
    fullColourway: "Wren/Kangaroo/Vanilla Ice",
    colours: ["brown", "cream"],
    stockxUrl: "https://stockx.com/salomon-xt-6-recut-wren-kangaroo",
    sourceUrl: "https://yolo66.x.yupoo.com/albums/189790210?uid=1&isSubCate=true&referrercate=406486",
    sourceTitle: "250Y【绿X/GX Batch】 XT-6（36-46.5）星棕 473058",
    imageKeys: ["e6f902b8", "e624c1c7", "436e1e75", "7e4caa56", "4c5f0649", "1a44025a", "85966351", "fee2ba3a"],
  },
  {
    code: "417510",
    model: "Salomon XT-6",
    title: "Salomon XT-6 - Turtledove Vintage Khaki",
    handle: "salomon-xt-6-turtledove-vintage-khaki",
    colourway: "Turtledove Vintage Khaki",
    fullColourway: "Turtledove/Vintage Khaki/Kelp",
    colours: ["beige", "green", "brown"],
    stockxUrl: "https://stockx.com/salomon-xt-6-turtledove-vintage-khaki",
    sourceUrl: "https://yolo66.x.yupoo.com/albums/189790212?uid=1&isSubCate=true&referrercate=406486",
    sourceTitle: "250Y【绿X/GX Batch】 XT-6（36-46.5）斑鸠棕 417510",
    imageKeys: ["6d1b70ec", "8bfc4e51", "2f3bd440", "c41090c0", "dbcd5ac3", "95a113ca", "e6ddfb5a", "3cfea566"],
  },
]

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body
}

const listSalomon = async () => {
  const products = []
  for (let offset = 0; offset < 300; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&q=Salomon&fields=id,title,handle,external_id,*options,*options.values,*variants,*variants.options,*images,metadata`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) break
  }
  return products
}

const downloadImages = async (product) => {
  const folder = path.join(IMPORT_DIR, "images", product.code)
  await fs.mkdir(folder, { recursive: true })
  const paths = []
  for (const [index, key] of product.imageKeys.entries()) {
    const filePath = path.join(folder, `${String(index + 1).padStart(2, "0")}.jpg`)
    const response = await fetch(`https://photo.yupoo.com/yolo66/${key}/big.jpg`, { headers: { referer: product.sourceUrl, "user-agent": "Mozilla/5.0" } })
    if (!response.ok) throw new Error(`Image download failed ${response.status} for ${product.code}/${key}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length < 10_000) throw new Error(`Image too small (${bytes.length} bytes) for ${product.code}/${key}`)
    await fs.writeFile(filePath, bytes)
    paths.push(filePath)
  }
  return paths
}

const uploadImages = async (paths) => {
  const urls = []
  for (const filePath of paths) {
    const data = await fs.readFile(filePath)
    const form = new FormData()
    form.append("files", new File([data], path.basename(filePath), { type: "image/jpeg" }))
    const response = await fetch(`${BACKEND_URL}/admin/uploads`, { method: "POST", headers: authHeaders, body: form })
    const body = await response.json()
    if (!response.ok || !body.files?.[0]?.url) throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 800)}`)
    urls.push(body.files[0].url)
  }
  return urls
}

const descriptionFor = (product) => `${product.title.replace("Salomon ", "The Salomon ")} brings the XT-6's trail-running design to an everyday colourway, with a breathable mesh upper, Quicklace closure, cushioned midsole and grippy Contagrip outsole.\n\nThe ${product.fullColourway.replaceAll("/", ", ")} palette is the exact StockX colourway for style ${product.code}.\n\nTrue to size for most buyers. Sizes are shown as US Men's / US Women's.`

const productPayload = (product, imageUrls) => ({
  title: product.title,
  handle: product.handle,
  subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
  description: descriptionFor(product),
  status: "published",
  type_id: TYPE_ID,
  weight: 900,
  shipping_profile_id: SHIPPING_PROFILE_ID,
  sales_channels: [{ id: SALES_CHANNEL_ID }],
  collection_id: COLLECTION_ID,
  categories: [{ id: CATEGORY_ID }],
  tags: [BRAND_TAG, LINE_TAG, ...product.colours.map((colour) => COLOUR_TAGS[colour])].filter(Boolean).map((id) => ({ id })),
  external_id: `yupoo-salomon-xt6-${product.code}`,
  discountable: true,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  metadata: {
    brand: "Salomon",
    model: product.model,
    source: "yupoo",
    source_url: product.sourceUrl,
    source_title: product.sourceTitle,
    source_category: product.sourceUrl.includes("referrercate=766544") ? "https://yolo66.x.yupoo.com/categories/766544" : "https://yolo66.x.yupoo.com/categories/406486",
    product_code: product.code,
    corrected_product_code: product.code,
    colourway: product.colourway,
    full_colourway: product.fullColourway,
    colour_tags: product.colours.map((colour) => `colour:${colour}`).join(" | "),
    colour_source: "StockX",
    colour_confidence: "verified",
    stockx_url: product.stockxUrl,
    size_display_note: "Sizes are shown as US Men's / US Women's.",
    source_size_system: "eu",
    display_size_system: "salomon-us",
    ...(product.duplicateAlbum ? { duplicate_source_album: product.duplicateAlbum } : {}),
  },
})

const updateExisting = async (existing, product, imageUrls) => {
  const payload = productPayload(product, imageUrls)
  const updated = await adminFetch(`/admin/products/${existing.id}`, { method: "POST", body: JSON.stringify(payload) })
  const option = existing.options?.find((item) => item.title === "Size")
  if (!option || option.values?.length !== MEN_SIZES.length || existing.variants?.length !== MEN_SIZES.length) {
    throw new Error(`${product.code} does not have the expected 16-value Salomon size structure`)
  }
  const variantsBySku = new Map(existing.variants.map((variant) => [variant.sku, variant]))
  for (const size of MEN_SIZES) {
    const variant = variantsBySku.get(`SALOMON-XT6-${product.code}-${size}`)
    if (!variant) throw new Error(`Missing variant for ${product.code} men's ${size}`)
    const optionValue = variant.options?.find((item) => item.option_id === option.id)
    if (!optionValue) throw new Error(`Missing Size option value for ${product.code} men's ${size}`)
    await adminFetch(`/admin/product-options/${option.id}/values/${optionValue.id}`, {
      method: "POST",
      body: JSON.stringify({ value: sizeLabel(size) }),
    })
    await adminFetch(`/admin/products/${existing.id}/variants/${variant.id}`, {
      method: "POST",
      body: JSON.stringify({ title: sizeLabel(size) }),
    })
  }
  return updated.product
}

const createNew = async (product, imageUrls) => {
  const payload = {
    ...productPayload(product, imageUrls),
    options: [{ title: "Size", values: MEN_SIZES.map(sizeLabel) }],
    variants: MEN_SIZES.map((size) => ({
      title: sizeLabel(size),
      sku: `SALOMON-XT6-${product.code}-${size}`,
      manage_inventory: false,
      allow_backorder: false,
      options: { Size: sizeLabel(size) },
      prices: ["nzd", "eur", "usd"].map((currency_code) => ({ currency_code, amount: PRICE })),
    })),
  }
  return (await adminFetch("/admin/products", { method: "POST", body: JSON.stringify(payload) })).product
}

await fs.mkdir(IMPORT_DIR, { recursive: true })
const existing = await listSalomon()
const byCode = new Map(existing.map((product) => [String(product.metadata?.product_code || product.external_id?.match(/(\d{6})$/)?.[1] || ""), product]))
const plan = PRODUCTS.map((product) => ({ code: product.code, title: product.title, action: byCode.has(product.code) ? "update" : "create", existing_id: byCode.get(product.code)?.id || null, source_url: product.sourceUrl, stockx_url: product.stockxUrl }))
const report = { started_at: new Date().toISOString(), mode: dryRun ? "dry-run" : sizesOnly ? "sizes-only" : "apply", supplied_album_count: 4, distinct_style_count: 3, duplicate_album_count: 1, plan, completed: [], failed: [] }
console.log(JSON.stringify(plan, null, 2))

if (!dryRun) {
  for (const product of PRODUCTS) {
    try {
      const current = byCode.get(product.code)
      const imageUrls = sizesOnly && current
        ? (current.images || []).map((image) => image.url)
        : await uploadImages(await downloadImages(product))
      const result = current ? await updateExisting(current, product, imageUrls) : await createNew(product, imageUrls)
      report.completed.push({ code: product.code, action: current ? "updated" : "created", id: result.id, handle: result.handle, image_count: imageUrls.length })
      console.log(`${current ? "Updated" : "Created"} ${product.code}: ${result.id}`)
    } catch (error) {
      report.failed.push({ code: product.code, error: error.message })
      console.error(`FAILED ${product.code}: ${error.message}`)
    }
    await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  }
}
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Report: ${REPORT_PATH}`)
if (report.failed.length) process.exitCode = 1
