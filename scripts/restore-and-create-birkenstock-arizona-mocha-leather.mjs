import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const UPLOAD_REPORT_PATH = path.resolve(
  "../medusa-imports/birkenstock-arizona-mocha-leather-update-report.json"
)
const REPORT_PATH = path.resolve(
  "../medusa-imports/birkenstock-arizona-mocha-separate-listing-report.json"
)
const ORIGINAL_PRODUCT_ID = "prod_01KVMXFJCW4KF6RNDZT8YK0EH6"
const ORIGINAL_HANDLE = "birkenstock-arizona-mocha"
const NEW_HANDLE = "birkenstock-arizona-mocha-leather"
const NEW_EXTERNAL_ID = "CUSTOMER-PHOTO-BIRKENSTOCK-ARIZONA-MOCHA-LEATHER-20260816"
const dryRun = process.argv.includes("--dry-run")

const EXPECTED_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
const EXPECTED_TAGS = ["birkenstock", "birkenstock-arizona", "colour:brown"]
const PRICE_CURRENCIES = ["nzd", "usd", "eur"]

const ORIGINAL_TITLE = "Birkenstock Arizona - Mocha"
const ORIGINAL_DESCRIPTION = `Birkenstock Arizona - Mocha brings Birkenstock's recognisable Arizona silhouette in a mocha colourway.

Two-strap sandal with adjustable buckles, Birkenstock's contoured cork-latex footbed and an EVA outsole.

A versatile everyday option, it pairs easily with relaxed, casual rotation.`
const ORIGINAL_IMAGE_BASE =
  "https://s3.us-east-1.amazonaws.com/medusajs.cloud-data-prod-use1-20241127093450366600000001/ef41071f10284718734"
const ORIGINAL_IMAGE_URLS = [
  `${ORIGINAL_IMAGE_BASE}/squarespace-birkenstock-1-01KVMXFCK4B5ES5X7RQ0QDBKCY.webp`,
  `${ORIGINAL_IMAGE_BASE}/squarespace-birkenstock-2-01KVMXFD5VM1FZT5XRFXQY32ZJ.webp`,
  `${ORIGINAL_IMAGE_BASE}/squarespace-birkenstock-3-01KVMXFDRZPX589SBW5WRQ5HXR.webp`,
  `${ORIGINAL_IMAGE_BASE}/squarespace-birkenstock-4-01KVMXFF41B0CM0QEDK428KN0N.webp`,
  `${ORIGINAL_IMAGE_BASE}/squarespace-birkenstock-5-01KVMXFFPEGFKNXTA2NZKS1EAG.webp`,
  `${ORIGINAL_IMAGE_BASE}/squarespace-birkenstock-6-01KVMXFGACVF44BTGKQBS2KQWJ.webp`,
  `${ORIGINAL_IMAGE_BASE}/squarespace-birkenstock-7-01KVMXFGWCAFMS14FG4KFJST77.webp`,
  `${ORIGINAL_IMAGE_BASE}/squarespace-birkenstock-8-01KVMXFHF8EYCE68HWW9Y9MDH3.webp`,
]
const ORIGINAL_METADATA = {
  brand: "Birkenstock",
  model: "Arizona",
  source: "squarespace",
  colourway: "Mocha",
  source_url: "shop-all",
  colour_tags: "colour:brown",
  product_code: "SQUARESPACE-BIRKENSTOCK-676F8E18707973664DE1C6CA",
  source_title: "Birks Arizona - Mocha leather",
  colour_source:
    "https://stockx.com/brands/birkenstock?category=shoes&model=arizona&color=brown",
  source_export: "/Users/mrburns_mac/Downloads/products_Jun-21_10-36-19PM.csv",
  colour_confidence: "partial",
  size_display_note: "Sizes are shown as EU buttons.",
  source_size_system: "eu",
  display_size_system: "eu",
  image_source_policy: "Squarespace export images only",
  squarespace_product_id: "676f8e18707973664de1c6ca",
  squarespace_image_count: 8,
  material: null,
  upper_material: null,
  full_colourway: null,
  primary_colour: null,
  footbed_type: null,
  footbed: null,
  seo_title: null,
  meta_description: null,
  image_source: null,
  customer_image_files: null,
  customer_image_count: null,
  customer_image_update_at: null,
}

const NEW_TITLE = "Birkenstock Arizona - Mocha Leather"
const NEW_DESCRIPTION = `Birkenstock Arizona - Mocha Leather brings Birkenstock's recognisable two-strap silhouette in a rich mocha brown colourway.

The leather upper features two individually adjustable straps with metal pin buckles, allowing the fit to be tuned across the foot.

Underfoot, Birkenstock's regular contoured cork-latex footbed supports the natural shape of the foot, while the lightweight EVA outsole keeps the sandal easy to wear every day.

A versatile Arizona pair for relaxed, casual rotation.`
const SEO_TITLE = "Birkenstock Arizona - Mocha Leather | MUSE NZ"
const META_DESCRIPTION =
  "Shop Birkenstock Arizona Mocha Leather with a regular contoured cork-latex footbed, adjustable double straps and EU sizes 35–45 online at MUSE NZ today."

const apiKey = (await fs.readFile(ENV_PATH, "utf8")).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)

const adminFetch = async (url, options = {}) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${BACKEND_URL}${url}`, {
        ...options,
        headers: { Authorization: `Basic ${apiKey}`, ...(options.headers || {}) },
        signal: AbortSignal.timeout(30000),
      })
      const text = await response.text()
      let body
      try {
        body = text ? JSON.parse(text) : {}
      } catch {
        body = { raw: text }
      }
      if (!response.ok) {
        throw new Error(
          `${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1600)}`
        )
      }
      return body
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
    }
  }
}

const fields = [
  "id",
  "title",
  "handle",
  "status",
  "subtitle",
  "description",
  "external_id",
  "discountable",
  "weight",
  "shipping_profile_id",
  "thumbnail",
  "*images",
  "*options",
  "*variants",
  "*variants.prices",
  "*variants.options",
  "*tags",
  "*categories",
  "*collection",
  "*type",
  "*sales_channels",
  "metadata",
].join(",")

const original = (
  await adminFetch(`/admin/products/${ORIGINAL_PRODUCT_ID}?fields=${encodeURIComponent(fields)}`)
).product
if (!original || original.handle !== ORIGINAL_HANDLE) {
  throw new Error(
    `Expected original product ${ORIGINAL_PRODUCT_ID}/${ORIGINAL_HANDLE}; found ${original?.id}/${original?.handle}`
  )
}

const sizes = original.variants
  .map((variant) => String(variant.title))
  .sort((a, b) => Number(a) - Number(b))
if (JSON.stringify(sizes) !== JSON.stringify(EXPECTED_SIZES)) {
  throw new Error(`Unexpected original size run: ${sizes.join(", ")}`)
}
const tagValues = original.tags.map((tag) => tag.value).sort()
for (const expectedTag of EXPECTED_TAGS) {
  if (!tagValues.includes(expectedTag)) throw new Error(`Original product is missing tag: ${expectedTag}`)
}
if (original.collection?.title !== "Standard Delivery") {
  throw new Error(`Unexpected original collection: ${original.collection?.title}`)
}
if (original.type?.value !== "Standard Delivery") {
  throw new Error(`Unexpected original product type: ${original.type?.value}`)
}
if (!original.categories.some((category) => category.name === "Sandals & Clogs")) {
  throw new Error("Original product is missing the Sandals & Clogs category")
}

const uploadReport = JSON.parse(await fs.readFile(UPLOAD_REPORT_PATH, "utf8"))
const uploadedFiles = uploadReport.uploaded_files || []
const customerImageUrls = uploadedFiles.map((file) => file.url)
if (customerImageUrls.length !== 6 || customerImageUrls.some((url) => !url)) {
  throw new Error(`Expected six reusable uploaded image URLs in ${UPLOAD_REPORT_PATH}`)
}

const existingNewProducts = (
  await adminFetch(
    `/admin/products?handle=${encodeURIComponent(NEW_HANDLE)}&fields=${encodeURIComponent(fields)}`
  )
).products || []
if (existingNewProducts.length > 1) {
  throw new Error(`Found multiple products using new handle ${NEW_HANDLE}`)
}

const restorePayload = {
  title: ORIGINAL_TITLE,
  description: ORIGINAL_DESCRIPTION,
  thumbnail: ORIGINAL_IMAGE_URLS[0],
  images: ORIGINAL_IMAGE_URLS.map((url) => ({ url })),
  metadata: ORIGINAL_METADATA,
}

const createPayload = {
  title: NEW_TITLE,
  subtitle: original.subtitle,
  handle: NEW_HANDLE,
  description: NEW_DESCRIPTION,
  status: "published",
  discountable: original.discountable,
  weight: original.weight || 900,
  external_id: NEW_EXTERNAL_ID,
  thumbnail: customerImageUrls[0],
  images: customerImageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: EXPECTED_SIZES }],
  variants: EXPECTED_SIZES.map((size) => ({
    title: size,
    sku: `MUSE-BIRK-ARIZONA-MOCHA-LEATHER-${size}`,
    allow_backorder: true,
    manage_inventory: false,
    weight: original.weight || 900,
    options: { Size: size },
    prices: PRICE_CURRENCIES.map((currency_code) => ({ currency_code, amount: 150 })),
    metadata: { eu_size: size, display_size: size, size_system: "eu" },
  })),
  shipping_profile_id: original.shipping_profile_id || "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  collection_id: original.collection.id,
  categories: original.categories.map(({ id }) => ({ id })),
  type_id: original.type.id,
  tags: original.tags.map(({ id }) => ({ id })),
  sales_channels: original.sales_channels.map(({ id }) => ({ id })),
  metadata: {
    brand: "Birkenstock",
    model: "Arizona",
    source: "customer_provided_photos",
    material: "Leather",
    upper_material: "Leather",
    colourway: "Mocha",
    full_colourway: "Mocha Leather",
    primary_colour: "Brown",
    colour_tags: "colour:brown",
    footbed_type: "regular (non-soft footbed)",
    footbed: "Regular",
    source_size_system: "eu",
    display_size_system: "eu",
    size_display_note: "Sizes are shown as EU buttons.",
    seo_title: SEO_TITLE,
    meta_description: META_DESCRIPTION,
    image_source: "customer-provided product photography",
    image_source_policy: "Customer-provided product photography only",
    customer_image_files: uploadedFiles
      .map((file) => file.filename || path.basename(file.local_path || file.url))
      .join(" | "),
    customer_image_count: customerImageUrls.length,
    separate_listing_of: ORIGINAL_PRODUCT_ID,
    original_listing_preserved: true,
  },
}

if (dryRun) {
  const report = {
    dry_run: true,
    original_product: {
      id: original.id,
      handle: original.handle,
      current_title: original.title,
      restore_title: restorePayload.title,
      restore_image_count: restorePayload.images.length,
    },
    new_product: {
      existing_id: existingNewProducts[0]?.id || null,
      payload: createPayload,
    },
  }
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        dry_run: true,
        restore: report.original_product,
        create: {
          title: createPayload.title,
          handle: createPayload.handle,
          image_count: createPayload.images.length,
          sizes: EXPECTED_SIZES,
          existing_id: report.new_product.existing_id,
        },
      },
      null,
      2
    )
  )
  process.exit(0)
}

const restored = (
  await adminFetch(`/admin/products/${ORIGINAL_PRODUCT_ID}?fields=${encodeURIComponent(fields)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(restorePayload),
  })
).product

let created = existingNewProducts[0]
let newProductCreated = false
if (!created) {
  created = (
    await adminFetch(`/admin/products?fields=${encodeURIComponent(fields)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createPayload),
    })
  ).product
  newProductCreated = true
}

const report = {
  corrected_at: new Date().toISOString(),
  original_product_restored: true,
  new_product_created: newProductCreated,
  original_product: restored,
  new_product: created,
  reused_uploaded_files: uploadedFiles,
}
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(
  JSON.stringify(
    {
      original: {
        id: restored.id,
        title: restored.title,
        handle: restored.handle,
        image_count: restored.images.length,
        metadata: restored.metadata,
      },
      separate_new_product: {
        created: newProductCreated,
        id: created.id,
        title: created.title,
        handle: created.handle,
        status: created.status,
        image_count: created.images.length,
        sizes: created.variants.map((variant) => variant.title).sort((a, b) => Number(a) - Number(b)),
        tags: created.tags.map((tag) => tag.value),
        categories: created.categories.map((category) => category.name),
        collection: created.collection?.title,
        type: created.type?.value,
      },
    },
    null,
    2
  )
)
console.log(`Report: ${REPORT_PATH}`)
