import fs from "node:fs/promises"
import path from "node:path"

// Bypasses Medusa's buggy bulk CSV product importer, which auto-casts any
// purely-numeric variant value (our "4", "4.5" sizes) to a JS number and then
// rejects it against its own string schema (confirmed unfixed upstream:
// medusajs/medusa#12771). Creates each product directly via POST
// /admin/products with a JSON body instead, which keeps sizes as real
// strings and is not affected by that bug.

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const IMPORT_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-salomon-xt6-406490"
const CSV_PATH = path.join(IMPORT_DIR, "salomon-xt6-medusa-import.csv")
const ENV_PATH = path.resolve(".image-upload.env")
const REPORT_PATH = path.join(IMPORT_DIR, "product-create-report.json")

const envText = await fs.readFile(ENV_PATH, "utf8")
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter(Boolean).map((line) => {
    const index = line.indexOf("=")
    return [line.slice(0, index), line.slice(index + 1)]
  })
)
const apiKey = env.MEDUSA_ADMIN_API_KEY
if (!apiKey?.startsWith("sk_")) {
  throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
}
const authHeaders = { Authorization: `Basic ${apiKey}` }

const dryRun = process.argv.includes("--dry-run")
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, "content-type": "application/json", ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 800)}`)
  }
  return body
}

// Minimal RFC4180 CSV parser (handles quoted fields with embedded commas/newlines).
const parseCsv = (text) => {
  const rows = []
  let row = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\r") {
      // ignore, \n handles the line break
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  const header = rows[0]
  return rows.slice(1).filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))
}

const csvText = await fs.readFile(CSV_PATH, "utf8")
const rows = parseCsv(csvText)

const byHandle = new Map()
for (const row of rows) {
  const handle = row["Product Handle"]
  if (!byHandle.has(handle)) byHandle.set(handle, [])
  byHandle.get(handle).push(row)
}

console.log(`Parsed ${rows.length} rows into ${byHandle.size} products`)

const existing = []
for (let offset = 0; offset < 200; offset += 100) {
  const response = await adminFetch(`/admin/products?limit=100&offset=${offset}&q=Salomon&fields=id,handle,external_id`)
  existing.push(...(response.products || []))
  if ((response.products || []).length < 100) break
}
const existingByHandle = new Map(existing.map((p) => [p.handle, p]))

const report = { started_at: new Date().toISOString(), created: [], skipped: [], failed: [] }
let count = 0

for (const [handle, productRows] of byHandle) {
  if (count >= limit) break
  count += 1

  if (existingByHandle.has(handle)) {
    console.log(`Skip ${handle}: already exists (${existingByHandle.get(handle).id})`)
    report.skipped.push({ handle, reason: "already exists", id: existingByHandle.get(handle).id })
    continue
  }

  const first = productRows[0]
  const tagIds = [first["Product Tag 1"], first["Product Tag 2"], first["Product Tag 3"], first["Product Tag 4"], first["Product Tag 5"]].filter(Boolean)
  const sizes = productRows.map((r) => r["Variant Option 1 Value"])

  const payload = {
    title: first["Product Title"],
    handle,
    subtitle: first["Product Subtitle"],
    description: first["Product Description"],
    status: first["Product Status"] || "published",
    weight: Number(first["Product Weight"]) || undefined,
    shipping_profile_id: first["Shipping Profile Id"],
    sales_channels: [{ id: first["Product Sales Channel 1"] }],
    collection_id: first["Product Collection Id"] || undefined,
    categories: first["Product Category 1"] ? [{ id: first["Product Category 1"] }] : undefined,
    tags: tagIds.map((id) => ({ id })),
    external_id: first["Product External Id"],
    discountable: first["Product Discountable"] === "true",
    options: [{ title: "Size", values: sizes }],
    variants: productRows.map((r) => ({
      title: r["Variant Title"],
      sku: r["Variant SKU"],
      manage_inventory: r["Variant Manage Inventory"] === "true",
      allow_backorder: r["Variant Allow Backorder"] === "true",
      options: { Size: r["Variant Option 1 Value"] },
      prices: [
        { currency_code: "nzd", amount: Number(r["Variant Price NZD"]) },
        { currency_code: "eur", amount: Number(r["Variant Price EUR"]) },
        { currency_code: "usd", amount: Number(r["Variant Price USD"]) },
      ],
    })),
  }

  if (dryRun) {
    console.log(`[dry-run] Would create ${handle} (${sizes.length} variants)`)
    report.created.push({ handle, dry_run: true, variant_count: sizes.length })
    continue
  }

  try {
    const result = await adminFetch("/admin/products", { method: "POST", body: JSON.stringify(payload) })
    console.log(`Created ${count}/${byHandle.size}: ${handle} -> ${result.product.id}`)
    report.created.push({ handle, id: result.product.id, external_id: first["Product External Id"] })
  } catch (error) {
    console.error(`FAILED ${handle}: ${error.message}`)
    report.failed.push({ handle, error: error.message })
  }

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
}

report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Created: ${report.created.length}, Skipped: ${report.skipped.length}, Failed: ${report.failed.length}`)
console.log(`Report: ${REPORT_PATH}`)
