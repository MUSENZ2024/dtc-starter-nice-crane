import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-735665"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "gel-kayano-14-ko-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")

const SIZES = [
  "36",
  "37",
  "37.5",
  "38",
  "39",
  "39.5",
  "40",
  "40.5",
  "41.5",
  "42",
  "42.5",
  "43.5",
  "44",
  "44.5",
  "45",
  "46",
  "46.5",
  "47",
]

const PRICE = 160

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  brandTag: "ptag_01KT3WBGRY1SAJZC635R9S9S4E",
  lineTag: "ptag_01KT3WHJYJR1ECDCBASYR1QP6J",
}

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
}

const args = new Set(process.argv.slice(2))
const dryRun = args.has("--dry-run")
const forceImages = args.has("--force-images")
const limitArg = [...args].find((arg) => arg.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) {
  throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
}

const authHeaders = { Authorization: `Basic ${apiKey}` }

const csvParse = (text) => {
  const rows = []
  let row = []
  let field = ""
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") {
      field += char
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header, ...body] = rows
  return body.filter((line) => line.length === header.length).map((line) => Object.fromEntries(header.map((key, index) => [key, line[index]])))
}

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  }
  return body
}

const uploadFile = async (filePath) => {
  const data = await fs.readFile(filePath)
  const form = new FormData()
  form.append("files", new File([data], path.basename(filePath), { type: "image/jpeg" }))
  const response = await fetch(`${BACKEND_URL}/admin/uploads`, {
    method: "POST",
    headers: authHeaders,
    body: form,
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  }
  return body.files[0]
}

const listExistingProducts = async () => {
  const products = []
  for (let offset = 0; offset < 1000; offset += 100) {
    const response = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,thumbnail,*images`)
    products.push(...(response.products || []))
    if ((response.products || []).length < 100) {
      break
    }
  }
  return products
}

const createPayload = (album, review, imageUrls) => {
  const colourIds = (review.colour_tags || "")
    .split("|")
    .map((item) => item.trim().replace(/^colour:/, ""))
    .map((colour) => COLOUR_TAGS[colour])
    .filter(Boolean)

  return {
    title: review.product_name,
    subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
    handle: review.url_slug,
    description: review.product_details.replaceAll(" | ", "\n\n"),
    status: "published",
    discountable: true,
    weight: 400,
    external_id: review.product_external_id,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    options: [
      {
        title: "Size",
        values: SIZES,
      },
    ],
    variants: SIZES.map((size) => ({
      title: size,
      sku: `MUSE-GK14-KO-${review.product_external_id}-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
      allow_backorder: true,
      manage_inventory: false,
      weight: 400,
      options: {
        Size: size,
      },
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
    tags: [IDS.brandTag, IDS.lineTag, ...colourIds].map((id) => ({ id })),
    sales_channels: [{ id: IDS.salesChannel }],
    metadata: {
      source: "yupoo",
      source_url: album.source_url,
      source_title: album.source_title,
      product_code: review.product_code,
      source_category: "https://yolo88.x.yupoo.com/categories/735665?isSubCate=true",
      model: review.model,
      colourway: review.colourway,
      primary_colour: review.primary_colour,
      secondary_colour: review.secondary_colour,
      colour_tags: review.colour_tags,
      colour_confidence: review.colour_confidence,
      colour_source: review.colour_source,
    },
  }
}

const rawAlbums = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
const reviews = csvParse(await fs.readFile(REVIEW_PATH, "utf8"))
const reviewByExternalId = new Map(reviews.map((row) => [row.product_external_id, row]))
const existingProducts = await listExistingProducts()
const existingByHandle = new Map(existingProducts.map((product) => [product.handle, product]))
const existingByExternalId = new Map(existingProducts.filter((product) => product.external_id).map((product) => [product.external_id, product]))

const jobs = rawAlbums
  .map((album) => {
    const matchingReviews = reviews.filter((review) => review.source_url === album.source_url)
    const review = matchingReviews[0] || reviewByExternalId.get(`YUP735665-${album.product_code}`)
    const existing = existingByExternalId.get(review?.product_external_id) || existingByHandle.get(review?.url_slug)
    return { album, review, existing }
  })
  .filter((job) => job.review)
  .slice(0, limit)

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`)
console.log(`Jobs: ${jobs.length}`)
console.log(`Existing matched: ${jobs.filter((job) => job.existing).length}`)

if (dryRun) {
  for (const job of jobs) {
    console.log(`${job.existing ? "EXISTS" : "CREATE"} ${job.review.product_external_id} ${job.review.url_slug} images=${job.album.local_images.length}`)
  }
  process.exit(0)
}

const report = {
  started_at: new Date().toISOString(),
  backend_url: BACKEND_URL,
  created: [],
  skipped: [],
  updated_images: [],
}

let index = 0
for (const job of jobs) {
  index += 1
  if (job.existing && !forceImages) {
    report.skipped.push({
      product_id: job.existing.id,
      external_id: job.review.product_external_id,
      handle: job.review.url_slug,
      reason: "already exists",
    })
    console.log(`Skipped ${index}/${jobs.length}: ${job.review.product_external_id} already exists`)
    continue
  }

  const files = []
  for (const filePath of job.album.local_images.slice(0, 8)) {
    files.push({
      local_path: filePath,
      ...(await uploadFile(filePath)),
    })
  }
  const imageUrls = files.map((file) => file.url)

  if (job.existing) {
    const updated = await adminFetch(`/admin/products/${job.existing.id}?fields=id,title,handle,thumbnail,*images`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        thumbnail: imageUrls[0],
        images: imageUrls,
      }),
    })
    report.updated_images.push({
      product_id: updated.product?.id,
      external_id: job.review.product_external_id,
      handle: updated.product?.handle,
      files,
      image_count: updated.product?.images?.length,
    })
    console.log(`Updated images ${index}/${jobs.length}: ${job.review.product_external_id}`)
    continue
  }

  const created = await adminFetch("/admin/products?fields=id,title,handle,external_id,thumbnail,*images,*variants", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(createPayload(job.album, job.review, imageUrls)),
  })

  report.created.push({
    product_id: created.product?.id,
    external_id: created.product?.external_id,
    handle: created.product?.handle,
    title: created.product?.title,
    variant_count: created.product?.variants?.length,
    image_count: created.product?.images?.length,
    files,
  })
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Created ${index}/${jobs.length}: ${job.review.product_external_id} ${created.product?.id}`)
}

report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Report: ${REPORT_PATH}`)
