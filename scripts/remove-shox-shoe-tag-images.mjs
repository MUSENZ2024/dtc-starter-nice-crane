import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = path.resolve(".image-upload.env")
const SOURCE_REPORT_PATH = path.resolve("../medusa-imports/yupoo-category-898556/medusa-import-report.json")
const OUTPUT_PATH = path.resolve("../medusa-imports/yupoo-category-898556/shox-shoe-tag-removal-report.json")
const APPLY = process.argv.includes("--apply")
const EXPECTED_PRODUCT_COUNT = 28
const LABEL_IMAGE_NUMBER = new Map([
  ["IB7705-001", 3],
  ["IH4485-001", 3],
])

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
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

const listShoxProducts = async () => {
  const body = await adminFetch("/admin/products?limit=100&q=Shox&fields=id,title,handle,external_id,thumbnail,*images,*tags,metadata")
  return (body.products || []).filter((product) =>
    product.tags?.some((tag) => tag.value === "nike-shox-tl")
  )
}

const sourceReport = JSON.parse(await fs.readFile(SOURCE_REPORT_PATH, "utf8"))
const sourceByProductId = new Map(sourceReport.created.map((item) => [item.product_id, item]))
const products = await listShoxProducts()

if (products.length !== EXPECTED_PRODUCT_COUNT) {
  throw new Error(`Expected ${EXPECTED_PRODUCT_COUNT} tagged Shox products, found ${products.length}`)
}

const jobs = products.map((product) => {
  const source = sourceByProductId.get(product.id)
  if (!source) throw new Error(`No source import record for ${product.id} ${product.title}`)

  const code = product.metadata?.corrected_product_code || product.metadata?.product_code
  const labelImageNumber = LABEL_IMAGE_NUMBER.get(code) || 2
  const labelFileSuffix = `/${String(labelImageNumber).padStart(2, "0")}.jpg`
  const labelFile = source.files?.find((file) => file.local_path?.endsWith(labelFileSuffix))
  if (!labelFile?.url) throw new Error(`No label source URL found for ${code} ${product.title}`)

  const beforeUrls = (product.images || []).map((image) => image.url)
  const afterUrls = beforeUrls.filter((url) => url !== labelFile.url)
  if (beforeUrls.length !== 8 || afterUrls.length !== 7) {
    throw new Error(`Expected one matching label URL among 8 images for ${code}; got ${beforeUrls.length} before and ${afterUrls.length} after`)
  }
  if (product.thumbnail === labelFile.url) throw new Error(`Refusing to remove thumbnail label URL for ${code}`)

  return {
    product_id: product.id,
    title: product.title,
    handle: product.handle,
    product_code: code,
    label_source_image_number: labelImageNumber,
    removed_url: labelFile.url,
    thumbnail: product.thumbnail,
    before_urls: beforeUrls,
    after_urls: afterUrls,
  }
})

const report = {
  started_at: new Date().toISOString(),
  apply: APPLY,
  matched_products: jobs.length,
  updated: [],
  jobs,
}

if (APPLY) {
  for (const job of jobs) {
    const body = await adminFetch(`/admin/products/${job.product_id}?fields=id,title,handle,thumbnail,*images`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ images: job.after_urls.map((url) => ({ url })) }),
    })
    const updated = body.product
    const currentUrls = (updated.images || []).map((image) => image.url)
    if (currentUrls.length !== 7 || currentUrls.includes(job.removed_url)) {
      throw new Error(`Update verification failed for ${job.product_code} ${job.product_id}`)
    }
    report.updated.push({
      product_id: updated.id,
      title: updated.title,
      product_code: job.product_code,
      image_count: currentUrls.length,
      removed_url: job.removed_url,
    })
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2))
    console.log(`Updated ${job.product_code}: ${updated.title} (8 -> 7 images)`)
  }
}

const verifiedProducts = await listShoxProducts()
report.verification = verifiedProducts.map((product) => ({
  product_id: product.id,
  title: product.title,
  product_code: product.metadata?.corrected_product_code || product.metadata?.product_code,
  image_count: product.images?.length || 0,
  thumbnail: product.thumbnail,
}))
report.finished_at = new Date().toISOString()
await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2))

console.log(`${APPLY ? "Applied" : "Dry run"}: ${jobs.length} Shox products matched`)
console.log(`Report: ${OUTPUT_PATH}`)
