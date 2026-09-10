import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(process.cwd())
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "https://appealing-quince-change.medusajs.app"
const KEY_PATH = path.join(ROOT, ".image-upload.env")
const SQUARESPACE_ORDERS = path.resolve(ROOT, "../Orders_customersImport/orders (1).csv")
const OUTPUT_DIR = path.resolve(ROOT, "../medusa-imports/order-customers-marketing")
const execute = process.argv.includes("--execute")
const confirmation = "IMPORT AUTHORIZED ORDER CUSTOMERS"
const permissionBasis = "Store owner confirmed all imported order customers gave permission for marketing email."
const importId = `order-customers-${new Date().toISOString().replace(/[:.]/g, "-")}`

function parseCsv(text) {
  const rows = []
  let row = [], field = "", quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted && char === '"' && text[index + 1] === '"') { field += '"'; index += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (!quoted && char === ",") { row.push(field); field = ""; continue }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[index + 1] === "\n") index += 1
      row.push(field); rows.push(row); row = []; field = ""; continue
    }
    field += char
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [headers, ...data] = rows
  return data.filter((values) => values.some(Boolean)).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}

const clean = (value) => typeof value === "string" && value.trim() ? value.trim() : null
const emailKey = (value) => clean(value)?.toLowerCase() || null
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "")
const numberValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (value && typeof value === "object" && "value" in value) return Number(value.value) || 0
  return Number(String(value || 0).replace(/[$,]/g, "")) || 0
}
const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`
const splitName = (value) => {
  const parts = (clean(value) || "").split(/\s+/).filter(Boolean)
  return { first_name: parts[0] || null, last_name: parts.length > 1 ? parts.slice(1).join(" ") : null }
}

const envText = await fs.readFile(KEY_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${KEY_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

async function adminFetch(url, options = {}) {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 800)}`)
  return body
}

async function listAll(url, key) {
  const result = []
  for (let offset = 0; ; offset += 100) {
    const page = await adminFetch(`${url}${url.includes("?") ? "&" : "?"}limit=100&offset=${offset}`)
    const items = page[key] || []
    result.push(...items)
    if (items.length < 100) return result
  }
}

const orderFields = [
  "id", "email", "status", "total", "created_at", "customer.id", "customer.first_name",
  "customer.last_name", "shipping_address.first_name", "shipping_address.last_name", "metadata",
].join(",")
const [liveOrders, currentSubscribers, squarespaceRows] = await Promise.all([
  listAll(`/admin/orders?fields=${encodeURIComponent(orderFields)}`, "orders"),
  listAll("/admin/marketing/subscribers", "subscribers"),
  fs.readFile(SQUARESPACE_ORDERS, "utf8").then(parseCsv),
])

const contacts = new Map()
const invalid = []
const ensureContact = (email, names = {}) => {
  const normalized = emailKey(email)
  if (!normalized || !validEmail(normalized)) {
    invalid.push({ email: clean(email), reason: "invalid_or_missing_email" })
    return null
  }
  if (!contacts.has(normalized)) {
    contacts.set(normalized, {
      email: normalized,
      first_name: null,
      last_name: null,
      customer_id: null,
      order_count: 0,
      lifetime_revenue: 0,
      first_order_at: null,
      last_order_at: null,
      order_sources: new Set(),
      order_keys: new Set(),
    })
  }
  const contact = contacts.get(normalized)
  if (!contact.first_name && clean(names.first_name)) contact.first_name = clean(names.first_name)
  if (!contact.last_name && clean(names.last_name)) contact.last_name = clean(names.last_name)
  return contact
}

const addOrder = (contact, { key, createdAt, total, canceled, source, customerId }) => {
  if (!contact || contact.order_keys.has(key)) return
  contact.order_keys.add(key)
  contact.order_sources.add(source)
  if (customerId && !contact.customer_id) contact.customer_id = customerId
  if (!canceled) {
    contact.order_count += 1
    contact.lifetime_revenue += Math.max(0, numberValue(total))
  }
  const iso = createdAt ? new Date(createdAt).toISOString() : null
  if (iso && (!contact.first_order_at || iso < contact.first_order_at)) contact.first_order_at = iso
  if (iso && (!contact.last_order_at || iso > contact.last_order_at)) contact.last_order_at = iso
}

const liveLegacyIds = new Set()
for (const order of liveOrders) {
  const names = {
    first_name: clean(order.customer?.first_name) || clean(order.shipping_address?.first_name),
    last_name: clean(order.customer?.last_name) || clean(order.shipping_address?.last_name),
  }
  const contact = ensureContact(order.email, names)
  const legacyId = clean(order.metadata?.legacy_order_id)
  if (legacyId) liveLegacyIds.add(legacyId)
  addOrder(contact, {
    key: `live:${order.id}`,
    createdAt: order.created_at,
    total: order.total,
    canceled: order.status === "canceled",
    source: legacyId || order.metadata?.legacy_source === "squarespace" ? "squarespace" : "medusa",
    customerId: order.customer?.id || null,
  })
}

const groupedSquarespace = new Map()
for (const row of squarespaceRows) {
  const orderId = clean(row["Order ID"])
  if (orderId && !groupedSquarespace.has(orderId)) groupedSquarespace.set(orderId, row)
}
let squarespaceOnlyOrders = 0
for (const [orderId, row] of groupedSquarespace) {
  if (liveLegacyIds.has(orderId)) continue
  const names = splitName(row["Shipping Name"] || row["Billing Name"])
  const contact = ensureContact(row.Email, names)
  addOrder(contact, {
    key: `squarespace:${orderId}`,
    createdAt: row["Created at"],
    total: row.Total,
    canceled: Boolean(clean(row["Cancelled at"])),
    source: "squarespace",
    customerId: null,
  })
  squarespaceOnlyOrders += 1
}

const existingByEmail = new Map(currentSubscribers.map((item) => [emailKey(item.email_normalized || item.email), item]))
const payloadContacts = [...contacts.values()].map((contact) => ({
  email: contact.email,
  first_name: contact.first_name,
  last_name: contact.last_name,
  customer_id: contact.customer_id,
  order_count: contact.order_count,
  lifetime_revenue: Number(contact.lifetime_revenue.toFixed(2)),
  first_order_at: contact.first_order_at,
  last_order_at: contact.last_order_at,
  order_sources: [...contact.order_sources].sort(),
}))

const classification = payloadContacts.map((contact) => {
  const existing = existingByEmail.get(contact.email)
  return {
    ...contact,
    action: !existing ? "create" : existing.status === "suppressed" ? "preserve_suppressed" : existing.status === "unsubscribed" ? "preserve_unsubscribed" : "enrich_existing",
    existing_status: existing?.status || "",
  }
})

const report = {
  import_id: importId,
  generated_at: new Date().toISOString(),
  mode: execute ? "execute" : "dry-run",
  source_counts: {
    live_orders: liveOrders.length,
    squarespace_export_orders: groupedSquarespace.size,
    squarespace_orders_missing_from_live: squarespaceOnlyOrders,
    current_marketing_subscribers: currentSubscribers.length,
  },
  result_counts: {
    unique_order_emails: payloadContacts.length,
    with_first_name: payloadContacts.filter((item) => item.first_name).length,
    create: classification.filter((item) => item.action === "create").length,
    enrich_existing: classification.filter((item) => item.action === "enrich_existing").length,
    preserve_unsubscribed: classification.filter((item) => item.action === "preserve_unsubscribed").length,
    preserve_suppressed: classification.filter((item) => item.action === "preserve_suppressed").length,
    invalid_source_rows: invalid.length,
  },
  invalid,
  batches: [],
}

await fs.mkdir(OUTPUT_DIR, { recursive: true })
const csvHeaders = ["email", "first_name", "last_name", "order_count", "lifetime_revenue", "first_order_at", "last_order_at", "order_sources", "action", "existing_status"]
const csv = [csvHeaders.join(","), ...classification.map((row) => csvHeaders.map((key) => escapeCsv(key === "order_sources" ? row.order_sources.join("|") : row[key])).join(","))].join("\n") + "\n"
await fs.writeFile(path.join(OUTPUT_DIR, "order-customer-marketing-audit.csv"), csv)

if (execute) {
  for (let index = 0; index < payloadContacts.length; index += 100) {
    const subscribers = payloadContacts.slice(index, index + 100)
    const body = await adminFetch("/admin/marketing/subscribers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation, import_id: importId, permission_basis: permissionBasis, subscribers }),
    })
    report.batches.push({ index: report.batches.length + 1, size: subscribers.length, response: body })
  }
  const after = await listAll("/admin/marketing/subscribers", "subscribers")
  report.after = { marketing_subscribers: after.length }
  const afterByEmail = new Map(after.map((item) => [emailKey(item.email_normalized || item.email), item]))
  report.verification = {
    imported_present: payloadContacts.filter((item) => afterByEmail.has(item.email)).length,
    imported_missing: payloadContacts.filter((item) => !afterByEmail.has(item.email)).map((item) => item.email),
    unsubscribed_preserved: classification.filter((item) => item.action === "preserve_unsubscribed").every((item) => afterByEmail.get(item.email)?.status === "unsubscribed"),
    suppressed_preserved: classification.filter((item) => item.action === "preserve_suppressed").every((item) => afterByEmail.get(item.email)?.status === "suppressed"),
  }
}

await fs.writeFile(path.join(OUTPUT_DIR, "import-report.json"), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
