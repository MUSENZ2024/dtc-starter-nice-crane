import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const EXPORT_PATH = "/Users/mrburns_mac/Downloads/products_Jun-21_10-51-13PM.csv"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/squarespace-new-balance-9060-image-replacement"
const REPORT_PATH = path.join(BASE_DIR, "image-replacement-report.json")
const REVIEW_PATH = path.join(BASE_DIR, "new-balance-9060-image-replacement-review.csv")
const ENV_PATH = path.resolve(".image-upload.env")
const PRICE = 150
const dryRun = process.argv.includes("--dry-run")
const skipPrices = process.argv.includes("--skip-prices")
const priceOnly = process.argv.includes("--price-only")
const onlyCode = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length)?.toUpperCase()

// Mappings are research-backed. The three omitted Squarespace rows have no exact current Medusa code match and are deliberately retained in the review as needs_review.
const SOURCE_TO_CODE = {
  "new-balance-9060-seasalt": { code: "U9060MAC", name: "Sea Salt", source: "https://stockx.com/en-gb/new-balance-9060-sea-salt", confidence: "verified" },
  "new-balance-9060-quartz-grey": { code: "U9060HSA", name: "Quartz Grey", source: "https://www.laced.com/products/new-balance-9060-quartz-grey", confidence: "verified" },
  "new-balance-9060-panda-lggxl": { code: "U9060JAM", name: "Sea Salt Brown", source: "https://stockx.com/en-gb/new-balance-9060-sea-salt-brown", confidence: "verified" },
  "new-balance-9060-seasalt-s6ttr-h7ya2": { code: "U9060TAT", name: "Turtledove", source: "https://stockx.com/zh-cn/new-balance-9060-turtledove", confidence: "verified" },
  "new-balance-9060-joe-freshgoods": { code: "U9060JF1", name: "Joe Freshgoods Inside Voices Penny Cookie Pink", source: "https://stockx.com/new-balance-9060-joe-freshgoods-inside-voices-penny-cookie-pink", confidence: "verified" },
  "new-balance-9060-seasalt-s6ttr-h7ya2-ywwkn-9lcw8-c98s3-k4ccr-3yk39-yp8kz": { code: "U9060EED", name: "Chrome Blue", source: "https://stockx.com/new-balance-9060-chrome-blue", confidence: "verified" },
  "new-balance-9060-seasalt-s6ttr-h7ya2-ywwkn-9lcw8-c98s3-k4ccr-3yk39-yp8kz-jaxlf": { code: "U9060SG", name: "Magnet", source: "https://stockx.com/de-de/new-balance-9060-magnet", confidence: "verified" },
  "new-balance-9060-seasalt-s6ttr-h7ya2-ywwkn-9lcw8-c98s3-k4ccr-3yk39-yp8kz-jaxlf-saejg-fw3cm": { code: "U9060HSP", name: "December Sky", source: "https://stockx.com/en-gb/new-balance-9060-december-sky", confidence: "verified" },
  "new-balance-9060-seasalt-s6ttr-h7ya2-ywwkn-9lcw8-c98s3-k4ccr-3yk39-yp8kz-jaxlf-saejg-fw3cm-aj9ps": { code: "U9060MAC", name: "Sea Salt Turf", source: "https://sneakersandlaces.nl/en/products/new-balance-9060-sea-salt", confidence: "verified" },
  "new-balance-9060-seasalt-s6ttr-h7ya2-ywwkn-9lcw8-c98s3-k4ccr-3yk39-yp8kz-jaxlf-saejg-fw3cm-aj9ps-lbrna-j3scx-j2mlk": { code: "U9060IB", name: "Washed Blue", source: "https://thesolesupplier.co.uk/release-dates/new-balance/9060/new-balance-9060-washed-blue/", confidence: "verified" },
  "new-balance-9060-beige-white": { code: "U9060JF", name: "Festival Pack Beige White", source: "https://www.kickscrew.com/products/new-balance-9060-festival-pack-beige-white-u9060jf", confidence: "verified" },
  "new-balance-9060-triple-black-suade-feykm": { code: "U9060BPM", name: "Triple Black", source: "https://stockx.com/new-balance-9060-triple-black?size=13", confidence: "verified" },
}

const csvEscape = (value) => { const text = value == null ? "" : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text }
const parseCsv = (text) => {
  const rows = []; let row = [], field = "", quoted = false
  for (let i = 0; i < text.length; i += 1) { const char = text[i]; if (quoted && char === '"' && text[i + 1] === '"') { field += char; i += 1; continue }; if (char === '"') { quoted = !quoted; continue }; if (!quoted && char === ",") { row.push(field); field = ""; continue }; if (!quoted && (char === "\n" || char === "\r")) { if (char === "\r" && text[i + 1] === "\n") i += 1; row.push(field); rows.push(row); row = []; field = ""; continue }; field += char }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [headers, ...data] = rows; return data.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}

await fs.mkdir(BASE_DIR, { recursive: true })
const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }
const adminFetch = async (url, options = {}) => { const response = await fetch(`${BACKEND_URL}${url}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } }); const text = await response.text(); let body; try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }; if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`); return body }
const upload = async (url, index) => { for (let attempt = 1; attempt <= 3; attempt += 1) { try { const image = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!image.ok) throw new Error(`Squarespace image download failed ${image.status}`); const bytes = await image.arrayBuffer(); const contentType = image.headers.get("content-type") || "image/jpeg"; const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"; const form = new FormData(); form.append("files", new File([bytes], `squarespace-9060-${index + 1}.${extension}`, { type: contentType })); const body = await adminFetch("/admin/uploads", { method: "POST", body: form }); if (body.files?.[0]?.url) return body.files[0].url; throw new Error("Upload returned no URL") } catch (error) { if (attempt === 3) throw new Error(`${url}: ${error.message}`); await new Promise((resolve) => setTimeout(resolve, attempt * 1000)) } } }

const rows = parseCsv(await fs.readFile(EXPORT_PATH, "utf8")).filter((row) => row.Title)
const grouped = new Map()
for (const row of rows) { const mapping = SOURCE_TO_CODE[row["Product URL"]]; if (!mapping) continue; if (!grouped.has(mapping.code)) grouped.set(mapping.code, { ...mapping, rows: [] }); grouped.get(mapping.code).rows.push(row) }
const report = { started_at: new Date().toISOString(), dry_run: dryRun, updated: [], needs_review: [] }
const review = [["squarespace_title", "squarespace_handle", "target_code", "target_product_id", "target_handle", "research_name", "research_source", "image_count", "status", "notes"]]

for (const row of rows) {
  if (SOURCE_TO_CODE[row["Product URL"]]) continue
  report.needs_review.push({ title: row.Title, squarespace_handle: row["Product URL"], reason: "No exact existing Medusa product-code match; no product was changed." })
  review.push([row.Title, row["Product URL"], "", "", "", "", "", row["Hosted Image URLs"].trim().split(/\s+/).filter(Boolean).length, "needs_review", "No exact existing Medusa product-code match; no product was changed."])
}

for (const [code, group] of grouped) {
  if (onlyCode && code !== onlyCode) continue
  const search = await adminFetch(`/admin/products?q=${encodeURIComponent(code)}&limit=20&fields=id,title,handle,metadata,variants.*`)
  const matches = (search.products || []).filter((product) => String(product.metadata?.product_code || "").toUpperCase() === code)
  if (matches.length !== 1) throw new Error(`${code}: expected exactly one existing Medusa match, found ${matches.length}`)
  const product = matches[0]
  const sourceImages = group.rows.flatMap((row) => row["Hosted Image URLs"].trim().split(/\s+/).filter(Boolean))
  let uploadedUrls = []
  if (!dryRun && !priceOnly) for (const [index, imageUrl] of sourceImages.entries()) uploadedUrls.push(await upload(imageUrl, index))
  if (!dryRun) {
    if (!priceOnly) {
    await adminFetch(`/admin/products/${product.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ thumbnail: uploadedUrls[0], images: uploadedUrls.map((url) => ({ url })), metadata: { ...(product.metadata || {}), squarespace_image_replacement_at: new Date().toISOString(), squarespace_image_source: EXPORT_PATH, squarespace_image_source_handles: group.rows.map((row) => row["Product URL"]).join(" | "), squarespace_image_count: uploadedUrls.length, image_source_policy: "Squarespace export images only" } }) })
    }
    if (!skipPrices) await Promise.all((product.variants || []).map((variant) => adminFetch(`/admin/products/${product.id}/variants/${variant.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: PRICE })) }) })))
  }
  const record = { code, product_id: product.id, product_title: product.title, product_handle: product.handle, squarespace_handles: group.rows.map((row) => row["Product URL"]), uploaded_image_count: sourceImages.length, variants_price_updated: product.variants?.length || 0, status: dryRun ? "dry_run_replace" : "replaced" }
  report.updated.push(record)
  for (const sourceRow of group.rows) review.push([sourceRow.Title, sourceRow["Product URL"], code, product.id, product.handle, group.name, group.source, sourceRow["Hosted Image URLs"].trim().split(/\s+/).filter(Boolean).length, record.status, group.rows.length > 1 ? "Merged Squarespace image sets because both rows resolve to the same researched product code." : ""])
  console.log(`${record.status}: ${code} -> ${product.title} (${sourceImages.length} Squarespace images)`)
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  await fs.writeFile(REVIEW_PATH, review.map((row) => row.map(csvEscape).join(",")).join("\n"))
}
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
await fs.writeFile(REVIEW_PATH, review.map((row) => row.map(csvEscape).join(",")).join("\n"))
console.log(`Review: ${REVIEW_PATH}`)
console.log(`Report: ${REPORT_PATH}`)
