import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(process.cwd())
const SOURCE_DIR = path.resolve(ROOT, "../Orders_customersImport")
const REPORT_DIR = path.resolve(ROOT, "../medusa-imports/customer-order-history")
const REPORT_PATH = path.join(REPORT_DIR, "import-report.json")
const ENV_PATH = path.resolve(ROOT, ".image-upload.env")
const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const REGION_ID = "reg_01KRAVBSR1Y0F6YHVEN5S97DYS"
const SALES_CHANNEL_ID = "sc_01KRATS3RAF685EQT0HTDJ8BAM"
const SHIPPING_OPTION_BY_NAME = new Map([
  ["Express Shipping", "so_01KRATS42K6P77NJ66SJA320P6"],
  ["Standard Shipping", "so_01KRATS42KXK1QBA3G36FR2T0R"],
  ["NZ Stock Standard", "so_01KT3G1G4JGYRNJF8V52S1TW61"],
  ["Standard Delivery", "so_01KT3GPC2KZ423NHV0AEAKRXRS"],
  ["Standard Express", "so_01KT3GQXRPWBFHJMCVGND397VW"],
  ["NZ Stock Express", "so_01KTNHBM3GZJEHA18SFM18B1A7"],
])

const execute = process.argv.includes("--execute")
const retryFailed = process.argv.includes("--retry-failed")

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
  return data.filter((values) => values.some((value) => value !== "")).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]))
  )
}

const clean = (value) => value?.trim() || undefined
const emailKey = (value) => clean(value)?.toLowerCase()
const money = (value) => Number(String(value || "0").replace(/[$,]/g, "")) || 0
const bool = (value) => /^(true|yes|1)$/i.test(clean(value) || "")
const countryCode = (value) => {
  const normalized = (clean(value) || "").toLowerCase()
  if (["new zealand", "nz", "nzl"].includes(normalized)) return "nz"
  if (["australia", "au", "aus"].includes(normalized)) return "au"
  return normalized.length === 2 ? normalized : undefined
}
const splitName = (value, fallbackFirst, fallbackLast) => {
  const parts = (clean(value) || "").split(/\s+/).filter(Boolean)
  return {
    first_name: parts.length ? parts[0] : clean(fallbackFirst),
    last_name: parts.length > 1 ? parts.slice(1).join(" ") : clean(fallbackLast),
  }
}
const isoDate = (value) => {
  const text = clean(value)
  if (!text) return undefined
  const match = text.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/)
  const normalized = match ? `${match[1]}T${match[2]}${match[3]}:${match[4]}` : text
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.valueOf())) throw new Error(`Invalid source date: ${value}`)
  return parsed.toISOString()
}

const addressFromCustomer = (row, prefix, defaults = {}) => {
  const name = splitName(row[`${prefix} Name`], defaults.first_name, defaults.last_name)
  const address = {
    ...name,
    address_1: clean(row[`${prefix} Address 1`]),
    address_2: clean(row[`${prefix} Address 2`]),
    city: clean(row[`${prefix} City`]),
    province: clean(row[`${prefix} Province/State`]),
    postal_code: clean(row[`${prefix} Zip`]),
    country_code: countryCode(row[`${prefix} Country`]),
    phone: clean(row[`${prefix} Phone Number`]),
  }
  return address.address_1 ? address : undefined
}

const addressFromOrder = (row, prefix) => {
  const name = splitName(row[`${prefix} Name`])
  const address = {
    ...name,
    address_1: clean(row[`${prefix} Address1`]),
    address_2: clean(row[`${prefix} Address2`]),
    city: clean(row[`${prefix} City`]),
    province: clean(row[`${prefix} Province`]),
    postal_code: clean(row[`${prefix} Zip`]),
    country_code: countryCode(row[`${prefix} Country`]),
    phone: clean(row[`${prefix} Phone`]),
  }
  return address.address_1 ? address : undefined
}

await fs.mkdir(REPORT_DIR, { recursive: true })
const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

async function adminFetch(url, options = {}) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(`${BACKEND_URL}${url}`, {
      ...options,
      headers: { ...authHeaders, ...(options.headers || {}) },
    })
    const text = await response.text()
    let body
    try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
    if (response.ok) return body
    const duplicate = response.status === 409 || /already imported|duplicate/i.test(JSON.stringify(body))
    if (duplicate) return { duplicate: true, error: body }
    if (response.status < 500 || attempt === 5) {
      throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 800)}`)
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
  }
}

async function listAll(url, key) {
  const result = []
  for (let offset = 0; ; offset += 100) {
    const separator = url.includes("?") ? "&" : "?"
    const page = await adminFetch(`${url}${separator}limit=100&offset=${offset}`)
    const items = page[key] || []
    result.push(...items)
    if (items.length < 100) return result
  }
}

const customerFiles = (await fs.readdir(SOURCE_DIR))
  .filter((name) => name.endsWith(".csv") && name !== "orders (1).csv")
  .sort()
const customerRows = []
for (const name of customerFiles) {
  customerRows.push(...parseCsv(await fs.readFile(path.join(SOURCE_DIR, name), "utf8")))
}
const orderRows = parseCsv(await fs.readFile(path.join(SOURCE_DIR, "orders (1).csv"), "utf8"))
const groupedOrders = new Map()
for (const row of orderRows) {
  const id = clean(row["Order ID"])
  if (!id) throw new Error("Order row has no Order ID")
  if (!groupedOrders.has(id)) groupedOrders.set(id, [])
  groupedOrders.get(id).push(row)
}

const liveCustomers = await listAll("/admin/customers?fields=id,email,first_name,last_name,phone,metadata", "customers")
const liveOrders = await listAll("/admin/orders?fields=id,customer_id,metadata", "orders")
const orderCountByCustomer = new Map()
for (const order of liveOrders) {
  if (order.customer_id) orderCountByCustomer.set(order.customer_id, (orderCountByCustomer.get(order.customer_id) || 0) + 1)
}
const customerByEmail = new Map()
for (const customer of liveCustomers) {
  const key = emailKey(customer.email)
  const current = customerByEmail.get(key)
  if (!current || (orderCountByCustomer.get(customer.id) || 0) > (orderCountByCustomer.get(current.id) || 0)) {
    customerByEmail.set(key, customer)
  }
}
const importedOrderIds = new Set(liveOrders.map((order) => order.metadata?.legacy_order_id).filter(Boolean))

const report = {
  started_at: new Date().toISOString(),
  mode: execute ? "execute" : "dry-run",
  source: SOURCE_DIR,
  source_counts: { customers: customerRows.length, orders: groupedOrders.size, order_lines: orderRows.length },
  before: { customers: liveCustomers.length, orders: liveOrders.length },
  customers: { created: 0, matched_existing: 0, addresses_created: 0, failed: [] },
  orders: { created: 0, skipped_existing: 0, failed: [] },
}
const saveReport = async () => fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
await saveReport()

for (const [index, row] of customerRows.entries()) {
  const email = emailKey(row.Email)
  if (!email) throw new Error(`Customer row ${index + 1} has no email`)
  let customer = customerByEmail.get(email)
  try {
    if (customer) {
      report.customers.matched_existing += 1
    } else if (execute) {
      const body = await adminFetch("/admin/customers?fields=id,email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: clean(row["First Name"]),
          last_name: clean(row["Last Name"]),
          phone: clean(row["Shipping Phone Number"]) || clean(row["Billing Phone Number"]),
          metadata: {
            legacy_source: "squarespace",
            legacy_created_on: isoDate(row["Created On"]),
            legacy_customer_since: isoDate(row["Customer Since"]),
            legacy_order_count: Number(row["Order Count"] || 0),
            legacy_total_spent: money(row["Total Spent"]),
            legacy_has_account: bool(row["Has Account"]),
            accepts_marketing: bool(row["Accepts Marketing"]),
            subscriber_since: isoDate(row["Subscriber Since"]),
            subscriber_source: clean(row["Subscriber Source"]),
            mailing_lists: clean(row["Mailing Lists"]),
          },
        }),
      })
      customer = body.customer
      customerByEmail.set(email, customer)
      report.customers.created += 1
    } else {
      customer = { id: `dry-customer-${index + 1}`, email }
      customerByEmail.set(email, customer)
      report.customers.created += 1
    }

    if (execute && customer && !liveCustomers.some((item) => item.id === customer.id)) {
      const defaults = { first_name: clean(row["First Name"]), last_name: clean(row["Last Name"]) }
      const shipping = addressFromCustomer(row, "Shipping", defaults)
      const billing = addressFromCustomer(row, "Billing", defaults)
      if (shipping) {
        await adminFetch(`/admin/customers/${customer.id}/addresses`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...shipping, address_name: "Legacy shipping", is_default_shipping: true, metadata: { legacy_source: "squarespace" } }),
        })
        report.customers.addresses_created += 1
      }
      if (billing && JSON.stringify(billing) !== JSON.stringify(shipping)) {
        await adminFetch(`/admin/customers/${customer.id}/addresses`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...billing, address_name: "Legacy billing", is_default_billing: true, metadata: { legacy_source: "squarespace" } }),
        })
        report.customers.addresses_created += 1
      }
    }
  } catch (error) {
    report.customers.failed.push({ row: index + 1, message: error.message })
    if (!retryFailed) throw error
  }
  if (index % 20 === 0) await saveReport()
}

for (const [index, [sourceOrderId, rows]] of [...groupedOrders.entries()].entries()) {
  const header = rows[0]
  if (importedOrderIds.has(sourceOrderId)) {
    report.orders.skipped_existing += 1
    continue
  }
  const email = emailKey(header.Email)
  const customer = customerByEmail.get(email)
  const discount = money(header["Discount Amount"])
  const total = money(header.Total)
  const refunded = money(header["Amount Refunded"])
  const createdAt = isoDate(header["Created at"])
  const status = clean(header["Cancelled at"]) ? "canceled" : clean(header["Fulfillment Status"])?.toLowerCase() === "fulfilled" ? "completed" : "pending"
  const items = rows.map((row, itemIndex) => ({
    title: clean(row["Lineitem name"]) || "Legacy item",
    quantity: Number(row["Lineitem quantity"] || 1),
    unit_price: money(row["Lineitem price"]),
    variant_sku: clean(row["Lineitem sku"]),
    variant_title: clean(row["Lineitem variant"]),
    requires_shipping: bool(row["Lineitem requires shipping"]),
    is_discountable: true,
    is_tax_inclusive: false,
    ...(itemIndex === 0 && discount ? { adjustments: [{ code: clean(header["Discount Code"]) || "legacy-discount", amount: discount, description: "Imported Squarespace discount" }] } : {}),
    metadata: { legacy_line_fulfillment_status: clean(row["Lineitem fulfillment status"]) },
  }))
  const shippingName = clean(header["Shipping Method"]) || "Legacy shipping"
  const shippingOptionId = SHIPPING_OPTION_BY_NAME.get(shippingName)
  const payload = {
    source_order_id: sourceOrderId,
    created_at: createdAt,
    order: {
      region_id: REGION_ID,
      customer_id: customer?.id,
      sales_channel_id: SALES_CHANNEL_ID,
      status,
      email,
      currency_code: (clean(header.Currency) || "NZD").toLowerCase(),
      no_notification: true,
      shipping_address: addressFromOrder(header, "Shipping"),
      billing_address: addressFromOrder(header, "Billing"),
      items,
      shipping_methods: money(header.Shipping) || shippingName ? [{
        name: shippingName,
        amount: money(header.Shipping),
        is_tax_inclusive: false,
        ...(shippingOptionId ? { shipping_option_id: shippingOptionId } : {}),
        data: { legacy_source: "squarespace" },
      }] : undefined,
      transactions: [
        { reference: "legacy_payment", reference_id: clean(header["Payment Reference"]) || sourceOrderId, amount: total, currency_code: "nzd" },
        ...(refunded ? [{ reference: "legacy_refund", reference_id: sourceOrderId, amount: -refunded, currency_code: "nzd" }] : []),
      ],
      metadata: {
        legacy_source: "squarespace",
        legacy_order_id: sourceOrderId,
        legacy_created_at: createdAt,
        legacy_paid_at: isoDate(header["Paid at"]),
        legacy_fulfilled_at: isoDate(header["Fulfilled at"]),
        legacy_cancelled_at: isoDate(header["Cancelled at"]),
        legacy_financial_status: clean(header["Financial Status"]),
        legacy_fulfillment_status: clean(header["Fulfillment Status"]),
        legacy_amount_refunded: refunded,
        legacy_channel_type: clean(header["Channel Type"]),
        legacy_channel_name: clean(header["Channel Name"]),
        legacy_channel_order_number: clean(header["Channel Order Number"]),
        legacy_payment_method: clean(header["Payment Method"]),
        legacy_payment_reference: clean(header["Payment Reference"]),
        legacy_private_notes: clean(header["Private Notes"]),
      },
    },
  }
  try {
    if (execute) {
      const body = await adminFetch("/admin/legacy-orders", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      })
      if (body.duplicate) report.orders.skipped_existing += 1
      else report.orders.created += 1
    } else {
      report.orders.created += 1
    }
  } catch (error) {
    report.orders.failed.push({ source_order_id: sourceOrderId, message: error.message })
    if (!retryFailed) throw error
  }
  if (index % 10 === 0) {
    console.log(`${execute ? "Imported" : "Validated"} ${index + 1}/${groupedOrders.size} orders`)
    await saveReport()
  }
}

if (execute) {
  const afterCustomers = await adminFetch("/admin/customers?limit=1&fields=id")
  const afterOrders = await adminFetch("/admin/orders?limit=1&fields=id")
  report.after = { customers: afterCustomers.count, orders: afterOrders.count }
}
report.finished_at = new Date().toISOString()
await saveReport()
console.log(JSON.stringify({ report: REPORT_PATH, mode: report.mode, customers: report.customers, orders: report.orders, after: report.after }, null, 2))
