import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-824845"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "mexico-66-sz-enriched-review.csv")
const IMPORT_PATH = path.join(BASE_DIR, "mexico-66-sz-medusa-import-safe-no-images.csv")
const REPORT_PATH = path.join(BASE_DIR, "image-upload-report.json")
const ENV_PATH = path.resolve(".image-upload.env")

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) {
  throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
}

const authHeaders = { Authorization: `Basic ${apiKey}` }
const dryRun = process.argv.includes("--dry-run")

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
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 600)}`)
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
    throw new Error(`Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 600)}`)
  }
  return body.files[0]
}

const rawAlbums = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
const reviewRows = csvParse(await fs.readFile(REVIEW_PATH, "utf8"))
const importRows = csvParse(await fs.readFile(IMPORT_PATH, "utf8"))
const reviewByCode = new Map(reviewRows.map((row) => [row.product_code, row]))

const importByCode = new Map()
for (const row of importRows) {
  if (!importByCode.has(row["Product External Id"])) {
    importByCode.set(row["Product External Id"], row)
  }
}

const products = []
for (let offset = 0; offset < 200; offset += 100) {
  const response = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,thumbnail,*images,*tags,metadata`)
  products.push(...(response.products || []))
}

const productsByHandle = new Map(products.map((product) => [product.handle, product]))
const jobs = []
const missing = []

for (const album of rawAlbums) {
  const importRow = importByCode.get(album.product_code)
  const review = reviewByCode.get(album.product_code)
  const product = productsByHandle.get(importRow?.["Product Handle"])
  if (!product) {
    missing.push({ code: album.product_code, handle: importRow?.["Product Handle"] })
    continue
  }

  const colourTagIds = [
    importRow["Product Tag 3"],
    importRow["Product Tag 4"],
    importRow["Product Tag 5"],
  ].filter(Boolean)
  const existingTagIds = (product.tags || []).map((tag) => tag.id)
  const tagIds = [...new Set([...existingTagIds, ...colourTagIds])]

  jobs.push({
    code: album.product_code,
    product_id: product.id,
    handle: product.handle,
    title: product.title,
    local_images: album.local_images.slice(0, 8),
    tag_ids: tagIds,
    metadata: {
      ...(product.metadata || {}),
      source: "yupoo",
      source_url: album.source_url,
      source_title: album.source_title,
      product_code: album.product_code,
      colourway: review?.colourway || "",
      primary_colour: review?.primary_colour || "",
      secondary_colour: review?.secondary_colour || "",
      colour_tags: review?.colour_tags || "",
      colour_confidence: review?.colour_confidence || "",
    },
  })
}

console.log(`Mode: ${dryRun ? "dry-run" : "upload"}`)
console.log(`Matched jobs: ${jobs.length}`)
console.log(`Missing: ${missing.length}`)
for (const item of missing) {
  console.log(`Missing ${item.code} ${item.handle}`)
}

if (dryRun) {
  process.exit(0)
}

const report = { started_at: new Date().toISOString(), uploaded: [], missing }
let index = 0
for (const job of jobs) {
  const files = []
  for (const filePath of job.local_images) {
    files.push({
      local_path: filePath,
      ...(await uploadFile(filePath)),
    })
  }
  const urls = files.map((file) => file.url)
  const updated = await adminFetch(`/admin/products/${job.product_id}?fields=id,title,handle,thumbnail,*images,*tags,metadata`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      thumbnail: urls[0],
      images: urls.map((url) => ({ url })),
      tags: job.tag_ids.map((id) => ({ id })),
      metadata: job.metadata,
    }),
  })
  index += 1
  report.uploaded.push({
    ...job,
    files,
    updated_image_count: updated.product?.images?.length,
    updated_tag_values: updated.product?.tags?.map((tag) => tag.value),
  })
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Updated ${index}/${jobs.length}: ${job.code} (${urls.length} images)`)
}

report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Report: ${REPORT_PATH}`)
