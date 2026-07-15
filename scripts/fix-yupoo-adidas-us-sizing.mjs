import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-adidas-2026-06-19/medusa-draft-import-report.json"
const OUT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-adidas-2026-06-19/adidas-us-sizing-fix-report.json"
const ENV_PATH = path.resolve(".image-upload.env")

const SIZE_MAP = {
  "35.5": { eu_size: "35.5", us_mens_size: "3.5", us_womens_size: "5", uk_size: "3", cm_jp_size: "22", display_size: "M 3.5 / W 5" },
  "36": { eu_size: "36", us_mens_size: "4", us_womens_size: "5.5", uk_size: "3.5", cm_jp_size: "22.5", display_size: "M 4 / W 5.5" },
  "36.5": { eu_size: "36.5", us_mens_size: "4.5", us_womens_size: "6", uk_size: "4", cm_jp_size: "23", display_size: "M 4.5 / W 6" },
  "37": { eu_size: "37", us_mens_size: "5", us_womens_size: "6.5", uk_size: "4.5", cm_jp_size: "23.5", display_size: "M 5 / W 6.5" },
  "38": { eu_size: "38", us_mens_size: "5.5", us_womens_size: "7", uk_size: "5", cm_jp_size: "24", display_size: "M 5.5 / W 7" },
  "38.5": { eu_size: "38.5", us_mens_size: "6", us_womens_size: "7.5", uk_size: "5.5", cm_jp_size: "24.5", display_size: "M 6 / W 7.5" },
  "39": { eu_size: "39", us_mens_size: "6.5", us_womens_size: "8", uk_size: "6", cm_jp_size: "25", display_size: "M 6.5 / W 8" },
  "40": { eu_size: "40", us_mens_size: "7", us_womens_size: "8.5", uk_size: "6.5", cm_jp_size: "25.5", display_size: "M 7 / W 8.5" },
  "40.5": { eu_size: "40.5", us_mens_size: "7.5", us_womens_size: "9", uk_size: "7", cm_jp_size: "26", display_size: "M 7.5 / W 9" },
  "41": { eu_size: "41", us_mens_size: "8", us_womens_size: "9.5", uk_size: "7.5", cm_jp_size: "26.5", display_size: "M 8 / W 9.5" },
  "42": { eu_size: "42", us_mens_size: "8.5", us_womens_size: "10", uk_size: "8", cm_jp_size: "27", display_size: "M 8.5 / W 10" },
  "42.5": { eu_size: "42.5", us_mens_size: "9", us_womens_size: "10.5", uk_size: "8.5", cm_jp_size: "27.5", display_size: "M 9 / W 10.5" },
  "43": { eu_size: "43", us_mens_size: "9.5", us_womens_size: "11", uk_size: "9", cm_jp_size: "28", display_size: "M 9.5 / W 11" },
  "44": { eu_size: "44", us_mens_size: "10", us_womens_size: "11.5", uk_size: "9.5", cm_jp_size: "28.5", display_size: "M 10 / W 11.5" },
  "45": { eu_size: "45", us_mens_size: "11", us_womens_size: "12.5", uk_size: "10.5", cm_jp_size: "29", display_size: "M 11 / W 12.5" },
}

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { Authorization: `Basic ${apiKey}`, ...(options.headers || {}) },
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body)}`)
  return body
}

const productIds = JSON.parse(await fs.readFile(REPORT_PATH, "utf8")).created.map(({ product_id }) => product_id)
const displayValues = Object.values(SIZE_MAP).map(({ display_size }) => display_size)
const report = { started_at: new Date().toISOString(), fixed: [], failed: [] }

for (const productId of productIds) {
  try {
    const { product } = await adminFetch(`/admin/products/${productId}?fields=id,title,handle,metadata,options.*,variants.*,variants.options.*`)
    const sizeOption = product.options?.find(({ title }) => title === "Size")
    if (!sizeOption) throw new Error("Missing Size option")

    await adminFetch(`/admin/products/${product.id}/options/${sizeOption.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ values: [...new Set([...displayValues, ...Object.keys(SIZE_MAP)])] }),
    })

    for (const variant of product.variants || []) {
      const size = SIZE_MAP[variant.metadata?.eu_size]
      if (!size) throw new Error(`Unknown source size ${variant.metadata?.eu_size || variant.title}`)
      await adminFetch(`/admin/products/${product.id}/variants/${variant.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: size.display_size,
          options: { Size: size.display_size },
          metadata: { ...(variant.metadata || {}), ...size, size_system: "adidas-us-men-women", source_size_system: "eu" },
        }),
      })
    }

    await adminFetch(`/admin/products/${product.id}/options/${sizeOption.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ values: displayValues }),
    })
    await adminFetch(`/admin/products/${product.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ metadata: { ...(product.metadata || {}), source_size_system: "eu", display_size_system: "adidas-us-men-women", size_display_note: "Sizes are shown as US Men's / US Women's." } }),
    })
    report.fixed.push({ product_id: product.id, handle: product.handle, variant_count: product.variants.length })
    console.log(`Fixed ${product.handle}`)
  } catch (error) {
    report.failed.push({ product_id: productId, error: error.message })
    console.error(`Failed ${productId}: ${error.message}`)
  }
}

report.finished_at = new Date().toISOString()
await fs.writeFile(OUT_PATH, JSON.stringify(report, null, 2))
console.log(`Wrote ${OUT_PATH}`)
