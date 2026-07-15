import fs from "node:fs/promises"
import path from "node:path"

const ROOT = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE"
const BASE_DIR = path.join(ROOT, "medusa-imports/yupoo-ugg-4679819")
const raw = JSON.parse(await fs.readFile(path.join(BASE_DIR, "raw-albums.json"), "utf8"))
const env = Object.fromEntries((await fs.readFile(".image-upload.env", "utf8")).split("\n").filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)))
const base = "https://appealing-quince-change.medusajs.app"
const headers = { authorization: `Basic ${env.MEDUSA_ADMIN_API_KEY}` }
const reportPath = path.join(BASE_DIR, "image-upload-report.json")
const priorUploadReport = JSON.parse(await fs.readFile(reportPath, "utf8").catch(() => "{\"uploaded\":[]}"))
const previouslyUploadedIds = new Set((priorUploadReport.uploaded || []).map((item) => item.product_id).filter(Boolean))
const importReport = JSON.parse(await fs.readFile(path.join(BASE_DIR, "medusa-import-report.json"), "utf8"))
const createdIds = new Set(importReport.created.map((item) => item.product_id).filter(Boolean))
const admin = async (route, init = {}) => {
  const response = await fetch(`${base}${route}`, { ...init, headers: { ...headers, ...(init.headers || {}) }, signal: AbortSignal.timeout(90000) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${init.method || "GET"} ${route}: ${response.status} ${JSON.stringify(body)}`)
  return body
}
const upload = async (filePath) => {
  const form = new FormData()
  form.append("files", new File([await fs.readFile(filePath)], path.basename(filePath), { type: "image/jpeg" }))
  const response = await fetch(`${base}/admin/uploads`, { method: "POST", headers, body: form, signal: AbortSignal.timeout(90000) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Upload ${filePath}: ${response.status} ${JSON.stringify(body)}`)
  return body.files?.[0]
}

const products = (await admin("/admin/products?limit=100&q=UGG&fields=id,title,external_id,thumbnail,images")).products || []
const productsByExternalId = new Map(products.map((product) => [product.external_id, product]))
const report = { started_at: new Date().toISOString(), uploaded: [], missing: [] }
for (const album of raw) {
  const sourceAlbumId = album.source_url.match(/albums\/(\d+)/)?.[1] || album.index
  const product = productsByExternalId.get(`YUP4679819-${sourceAlbumId}`)
  if (!product || previouslyUploadedIds.has(product.id)) continue
  if (!createdIds.has(product.id) && String(product.thumbnail || "").includes("s3.us-east-1.amazonaws.com")) continue
  const code = album.product_code || sourceAlbumId
  const files = []
  for (const localPath of album.local_images.slice(0, 8)) {
    const file = await upload(localPath)
    files.push({ local_path: localPath, file_id: file.id, url: file.url })
  }
  if (files.length !== 8) throw new Error(`${code} had ${files.length} upload(s), expected 8`)
  const updated = await admin(`/admin/products/${product.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ thumbnail: files[0].url, images: files.map((file) => ({ url: file.url })) }) })
  report.uploaded.push({ code, product_id: product.id, title: product.title, files, updated_image_count: updated.product?.images?.length, updated_thumbnail: updated.product?.thumbnail })
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log(`Updated ${code}: ${updated.product?.images?.length} Medusa-hosted images`)
}
report.finished_at = new Date().toISOString()
await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ uploaded: report.uploaded.length, missing: report.missing.length, report: reportPath }, null, 2))
