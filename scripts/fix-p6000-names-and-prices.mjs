import fs from "node:fs/promises"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-p6000-907068-597234"
const REPORT_PATH = `${BASE_DIR}/medusa-import-report.json`
const NIKE_LOOKUP_PATH = `${BASE_DIR}/nike-lookup-results.json`
const OUT_PATH = `${BASE_DIR}/p6000-name-price-fix-report.json`
const ENV_PATH = ".image-upload.env"
const PRICE = 160

const VERIFIED = {
  "BV1021-018": { name: "Ghost Summit White", colourway: "Ghost/Summit White", source: "Sneakerbaron exact-code result", confidence: "partial" },
  "IH4382-200": { name: "Independence Day", colourway: "Light Khaki/Pale Ivory/Thunder Blue/Cool Grey/University Red", source: "StockX exact-code result", confidence: "verified" },
  "BV1021-200": { name: "Fauna Brown", colourway: "Fauna Brown/Mink Brown/Black/Soft Pearl", source: "StockX / Sneakerjagers exact-code result", confidence: "verified" },
  "BV1021-109": { name: "White Light British Tan", colourway: "White/Light British Tan", source: "StockX / Laced exact-code result", confidence: "verified" },
  "IH0946-300": { name: "Premium Cordura Olive Flak Black Picante Red", colourway: "Olive Flak/Black/Quantum Moss/Picante Red", source: "Nike / StockX exact-code result", confidence: "verified" },
  "BV1021-013": { name: "Metallic Silver Black White", colourway: "Metallic Silver/Black/White", source: "StockX exact-code result", confidence: "verified" },
  "CD6404-002": { name: "Black", colourway: "Black/Black", source: "StockX / Nike exact-code result", confidence: "verified" },
  "CD6404-003": { name: "Black Cool Grey", colourway: "Black/Cool Grey", source: "StockX exact-code result", confidence: "verified" },
  "CD6404-107": { name: "White Metallic Silver Black", colourway: "White/Metallic Silver/Black/Black", source: "StockX / Nike exact-code result", confidence: "verified" },
  "CN0149-001": { name: "Metallic Silver", colourway: "Metallic Silver", source: "StockX exact-code result", confidence: "verified" },
}

const DESCRIPTIVE_FALLBACK = {
  "CD6404-608": "Gradient Blue",
  "CD6404-600": "Black Pink",
  "CD6404-606": "White Brown",
  "CD6404-400": "Blue White",
  "CD6404-402": "Blue White",
  "CD6404-008": "Black White Silver",
  "CD6404-028": "Grey Silver",
  "CD6404-100": "White Platinum Tint",
  "CD6404-101": "White Metallic Silver",
  "CD6404-103": "White Silver",
  "CD6404-104": "White Metallic Silver",
  "CD6404-203": "Brown Silver",
  "CD6404-204": "Light Khaki Silver",
  "CD6404-025": "Grey Silver",
  "HF0015-001": "Black Silver",
  "HF0015-002": "Black Metallic Silver",
  "HF0015-100": "White Metallic Silver",
  "HF0015-204": "Brown Silver",
  "HF4308-072": "Light Bone Metallic Silver",
  "HF0728-201": "Light Khaki Metallic Silver",
  "HF4898-121": "Sail Red",
  "HF5388-100": "White Metallic Silver",
  "HF1052-010": "Black White",
  "HV6353-001": "Black Metallic Silver",
  "HV8972-001": "Black Silver",
  "HV5984-001": "Black Metallic Silver",
  "HQ4054-001": "Black Metallic Silver",
  "HQ3818-001": "Black Metallic Silver",
  "HJ7361-133": "Sail University Red",
  "HJ7284-072": "Light Bone Metallic Silver",
  "HJ7246-100": "White Silver",
  "HJ3488-001": "Black White",
  "HJ3488-002": "Black Silver",
  "FQ8243-025": "Grey Silver",
  "FQ8732-010": "Black Metallic Silver",
  "FV6603-100": "White Metallic Silver",
  "FV0943-001": "Black Metallic Silver",
  "FN6837-012": "Grey Silver",
  "FN7509-029": "Grey Silver",
  "FD9876-101": "White Metallic Silver",
  "IB2986-002": "Black Silver",
  "IB2986-003": "Black Metallic Silver",
  "IB4019-019": "Black Silver",
  "IB3081-001": "Black Metallic Silver",
  "IF1756-100": "White Metallic Silver",
  "IF1787-100": "White Silver",
  "IF6137-001": "Black Silver",
  "IF6199-001": "Black Metallic Silver",
  "IF6199-002": "Black Silver",
  "IF6199-003": "Black Metallic Silver",
  "IH4465-095": "Grey Metallic Silver",
  "IH4468-095": "Bright Silver",
  "IH0946-100": "Sail Pale Ivory",
  "IH3646-499": "Blue Metallic Silver",
  "IM5237-100": "White Metallic Silver",
  "IM5237-600": "Pink Foam",
  "IM5997-060": "Grey Silver",
  "IM6026-121": "Sail Silver",
  "IM6767-068": "Grey Silver",
  "IO1904-010": "Black Silver",
  "IO1904-104": "White Metallic Silver",
  "IO8711-101": "Sail Metallic Silver",
  "IQ0296-491": "Blue Silver",
  "IQ0577-025": "Grey Silver",
  "IQ6590-002": "Black Metallic Silver",
  "BV1021-001": "Metallic Silver",
  "BV1021-016": "Light Bone Medium Olive",
  "BV1021-101": "White Metallic Silver",
  "BV1021-102": "Summit White Silver",
  "BV1021-103": "White Pure Platinum",
  "BV1021-104": "White Metallic Silver",
  "BV1021-106": "White Silver",
  "BV1021-108": "White Elemental Pink",
  "BV1021-018": "Ghost Summit White",
  "BV1021-200": "Fauna Brown",
  "CJ9585-600": "Pink Foam",
  "CV2209-111": "White Blue",
}

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }
const dryRun = process.argv.includes("--dry-run")

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[().']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const cleanColourName = (colourway) =>
  colourway
    .replace(/\bZwart\b/gi, "Black")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part, index, all) => all.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index)
    .join(" ")

const descriptionFor = (name, colourway) => [
  `The Nike P-6000 ${name} brings early-2000s running influence into a layered everyday sneaker with a ${colourway.toLowerCase()} colourway.`,
  "The silhouette draws from Nike Pegasus heritage with breathable mesh, synthetic overlays, and the P-6000's distinctive panelled runner shape.",
  `${name} keeps the look versatile for daily rotation, pairing easily with relaxed denim, cargos, and simple streetwear layers.`,
  "A cushioned midsole, padded collar, and low-profile build make it a practical option for all-day casual wear.",
].join("\n\n")

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
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
  return body
}

const report = JSON.parse(await fs.readFile(REPORT_PATH, "utf8"))
const nikeLookup = new Map(JSON.parse(await fs.readFile(NIKE_LOOKUP_PATH, "utf8")).filter((row) => row.color).map((row) => [row.code, row]))
const fixReport = { started_at: new Date().toISOString(), dry_run: dryRun, updated: [], unresolved: [] }

for (const item of report.created) {
  const code = item.external_id.replace("YUPP6000-", "")
  const nike = nikeLookup.get(code)
  const verified = VERIFIED[code]
  const fallbackName = DESCRIPTIVE_FALLBACK[code]
  const colourway = verified?.colourway || nike?.color || fallbackName
  const name = verified?.name || (nike?.color ? cleanColourName(nike.color) : fallbackName)
  const source = verified?.source || (nike ? `Nike ${nike.region}` : "descriptive fallback from product imagery/source title")
  const confidence = verified?.confidence || (nike ? "verified" : "partial")

  if (!name || !colourway) {
    fixReport.unresolved.push({ code, product_id: item.product_id, handle: item.handle })
    continue
  }

  const title = `Nike P-6000 - ${name}`
  const handle = slugify(`nike-p-6000-${name}-${code}`)
  const product = await adminFetch(`/admin/products/${item.product_id}?fields=id,title,handle,metadata,variants.*`)
  const variants = product.product?.variants || []

  if (!dryRun) {
    await adminFetch(`/admin/products/${item.product_id}?fields=id,title,handle,metadata,variants.*`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        handle,
        description: descriptionFor(name, colourway),
        metadata: {
          ...(product.product?.metadata || {}),
          colourway: name,
          full_colourway: colourway,
          product_code: code,
          corrected_product_code: code,
          colour_confidence: confidence,
          colour_source: source,
          researched_name_source: source,
          researched_name_url: verified?.url || nike?.url || "",
          price_corrected_to_nzd: PRICE,
        },
      }),
    })

    for (const variant of variants) {
      await adminFetch(`/admin/products/${item.product_id}/variants/${variant.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prices: [
            { currency_code: "nzd", amount: PRICE },
            { currency_code: "usd", amount: PRICE },
            { currency_code: "eur", amount: PRICE },
          ],
        }),
      })
    }
  }

  fixReport.updated.push({
    code,
    product_id: item.product_id,
    old_title: product.product?.title,
    new_title: title,
    old_handle: product.product?.handle,
    new_handle: handle,
    colourway,
    source,
    confidence,
    variants_price_updated: variants.length,
  })
  await fs.writeFile(OUT_PATH, JSON.stringify(fixReport, null, 2))
  console.log(`${dryRun ? "Would update" : "Updated"} ${code}: ${title} (${variants.length} variants)`)
}

fixReport.finished_at = new Date().toISOString()
await fs.writeFile(OUT_PATH, JSON.stringify(fixReport, null, 2))
console.log(`Updated: ${fixReport.updated.length}`)
console.log(`Unresolved: ${fixReport.unresolved.length}`)
console.log(`Report: ${OUT_PATH}`)
