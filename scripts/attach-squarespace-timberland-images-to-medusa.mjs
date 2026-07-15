import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const EXPORT_PATH = "/Users/mrburns_mac/Downloads/products_Jun-21_11-40-55PM.csv"
const PRODUCT_HANDLE = "timberland-6-inch-premium-waterproof-boot-wheat"
const OUT_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/timberland-6-inch-premium-wheat"
const REPORT_PATH = path.join(OUT_DIR, "squarespace-image-upload-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const dryRun = process.argv.includes("--dry-run")

const parseCsv = (text) => {
  const rows = []; let row = [], field = "", quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted && character === '"' && text[index + 1] === '"') { field += character; index += 1; continue }
    if (character === '"') { quoted = !quoted; continue }
    if (!quoted && character === ",") { row.push(field); field = ""; continue }
    if (!quoted && (character === "\n" || character === "\r")) { if (character === "\r" && text[index + 1] === "\n") index += 1; row.push(field); rows.push(row); row = []; field = ""; continue }
    field += character
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [headers, ...data] = rows
  return data.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }
const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body
}
const upload = async (url, index) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const source = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!source.ok) throw new Error(`Squarespace download failed (${source.status})`)
      const contentType = source.headers.get("content-type") || "image/jpeg"
      const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
      const form = new FormData()
      form.append("files", new File([await source.arrayBuffer()], `timberland-wheat-${index + 1}.${extension}`, { type: contentType }))
      const uploaded = await adminFetch("/admin/uploads", { method: "POST", body: form })
      if (uploaded.files?.[0]?.url) return uploaded.files[0].url
      throw new Error("Medusa upload returned no file URL")
    } catch (error) {
      if (attempt === 3) throw new Error(`${url}: ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000))
    }
  }
}

await fs.mkdir(OUT_DIR, { recursive: true })
const rows = parseCsv(await fs.readFile(EXPORT_PATH, "utf8"))
const source = rows.find((row) => row["Product URL"] === PRODUCT_HANDLE)
if (!source) throw new Error(`No Squarespace CSV product row found for ${PRODUCT_HANDLE}`)
const sourceUrls = source["Hosted Image URLs"].trim().split(/\s+/).filter(Boolean)
if (sourceUrls.length !== 9) throw new Error(`Expected 9 Squarespace image URLs; found ${sourceUrls.length}`)

const found = await adminFetch(`/admin/products?handle=${encodeURIComponent(PRODUCT_HANDLE)}&fields=id,title,handle,thumbnail,*images,metadata`)
const product = found.products?.[0]
if (!product) throw new Error(`No Medusa product found for ${PRODUCT_HANDLE}`)
if (product.images?.length && !process.argv.includes("--replace")) throw new Error(`Product already has ${product.images.length} image(s). Re-run with --replace only if replacement is intended.`)

let uploadedUrls = []
if (!dryRun) for (const [index, url] of sourceUrls.entries()) uploadedUrls.push(await upload(url, index))
const report = {
  started_at: new Date().toISOString(), dry_run: dryRun, product_id: product.id, product_handle: product.handle,
  source_export: EXPORT_PATH, source_image_count: sourceUrls.length, uploaded_image_count: uploadedUrls.length,
  source_urls: sourceUrls, uploaded_urls: uploadedUrls,
}
if (!dryRun) {
  const updated = await adminFetch(`/admin/products/${product.id}?fields=id,title,handle,thumbnail,*images,metadata`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      thumbnail: uploadedUrls[0], images: uploadedUrls.map((url) => ({ url })),
      metadata: { ...(product.metadata || {}), squarespace_image_source: EXPORT_PATH, squarespace_image_count: uploadedUrls.length, image_source_policy: "Squarespace export images only", squarespace_image_upload_at: new Date().toISOString() },
    }),
  })
  report.live_image_count = updated.product?.images?.length || 0
  report.thumbnail = updated.product?.thumbnail || null
}
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`${dryRun ? "Would attach" : "Attached"} ${sourceUrls.length} Squarespace images to ${product.title}.`)
console.log(`Report: ${REPORT_PATH}`)
