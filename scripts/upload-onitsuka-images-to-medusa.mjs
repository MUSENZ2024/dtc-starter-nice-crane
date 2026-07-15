import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const IMPORT_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-onitsuka-test"
const RAW_ALBUMS_PATH = path.join(IMPORT_DIR, "raw-albums.json")
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH = path.join(IMPORT_DIR, "image-upload-report.json")

const envText = await fs.readFile(ENV_PATH, "utf8")
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf("=")
      return [line.slice(0, index), line.slice(index + 1)]
    })
)

const apiKey = env.MEDUSA_ADMIN_API_KEY

if (!apiKey?.startsWith("sk_")) {
  throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
}

const authHeaders = {
  Authorization: `Basic ${apiKey}`,
}

const dryRun = process.argv.includes("--dry-run")
const force = process.argv.includes("--force")
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity

const extractCode = (title) => {
  const match = title?.match(/\b([A-Z]{1,4}\d{1,4}[A-Z]?[-.]\d{3,4}|\d{4}[A-Z]\d{3}-\d{3}|[A-Z]{2}\d[A-Z]\d[A-Z][-.]\d{4})\b/)
  return match?.[1]?.replace(".", "-")
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
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 500)}`)
  }

  return body
}

const listProducts = async () => {
  const response = await adminFetch("/admin/products?limit=100&q=Onitsuka&fields=id,title,handle,external_id,thumbnail,images")
  return response.products || []
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
    throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 500)}`)
  }

  return body.files?.[0]
}

const updateProductImages = async (productId, urls) => {
  return adminFetch(`/admin/products/${productId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      thumbnail: urls[0],
      images: urls.map((url) => ({ url })),
    }),
  })
}

const rawAlbums = JSON.parse(await fs.readFile(RAW_ALBUMS_PATH, "utf8"))
const products = await listProducts()
const productsByCode = new Map(products.map((product) => [product.external_id, product]))

const jobs = []
const missing = []

for (const album of rawAlbums) {
  const code = extractCode(album.source_title) || album.product_code
  const product = productsByCode.get(code)
  const localImages = (album.local_images || []).slice(0, 8)

  if (!product) {
    missing.push({
      code,
      source_title: album.source_title,
      local_folder: album.local_folder,
    })
    continue
  }

  jobs.push({
    code,
    product_id: product.id,
    title: product.title,
    handle: product.handle,
    existing_images: product.images?.length || 0,
    local_images: localImages,
  })
}

console.log(`Mode: ${dryRun ? "dry-run" : "upload"}`)
console.log(`Force existing image replacement: ${force ? "yes" : "no"}`)
console.log(`Products in Medusa: ${products.length}`)
console.log(`Matched jobs: ${jobs.length}`)
console.log(`Missing products: ${missing.length}`)

for (const job of jobs) {
  console.log(`${job.code} -> ${job.product_id} (${job.local_images.length} images) ${job.title}`)
}

if (missing.length) {
  console.log("Missing:")
  for (const item of missing) {
    console.log(`${item.code} ${item.source_title}`)
  }
}

if (dryRun) {
  process.exit(0)
}

const report = {
  started_at: new Date().toISOString(),
  backend_url: BACKEND_URL,
  uploaded: [],
  missing,
}

let completed = 0
for (const job of jobs.slice(0, limit)) {
  if (!force && job.existing_images >= 8) {
    console.log(`Skipped ${job.code}: already has ${job.existing_images} images`)
    report.uploaded.push({
      ...job,
      skipped: true,
      reason: "already has images",
    })
    continue
  }

  const files = []
  for (const filePath of job.local_images) {
    const uploaded = await uploadFile(filePath)
    files.push({
      local_path: filePath,
      file_id: uploaded.id,
      url: uploaded.url,
    })
  }

  const urls = files.map((file) => file.url)
  const updated = await updateProductImages(job.product_id, urls)
  completed += 1

  report.uploaded.push({
    ...job,
    files,
    updated_image_count: updated.product?.images?.length,
    updated_thumbnail: updated.product?.thumbnail,
  })

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Updated ${completed}/${Math.min(jobs.length, limit)}: ${job.code} (${urls.length} images)`)
}

report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Report: ${REPORT_PATH}`)
