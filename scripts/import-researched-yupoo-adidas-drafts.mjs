import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-adidas-2026-06-19"
const REVIEW_PATH = path.join(BASE_DIR, "adidas-yupoo-consolidated-review.csv")
const STOCKX_PATH = path.join(BASE_DIR, "stockx-search-results.json")
const REPORT_PATH = path.join(BASE_DIR, "medusa-researched-draft-import-report.json")
const ENV_PATH = path.resolve(".image-upload.env")
const SIZE_MAP = {
  "35.5": ["3.5", "5"], "36": ["4", "5.5"], "36.5": ["4.5", "6"], "37": ["5", "6.5"], "38": ["5.5", "7"],
  "38.5": ["6", "7.5"], "39": ["6.5", "8"], "40": ["7", "8.5"], "40.5": ["7.5", "9"], "41": ["8", "9.5"],
  "42": ["8.5", "10"], "42.5": ["9", "10.5"], "43": ["9.5", "11"], "44": ["10", "11.5"], "45": ["11", "12.5"],
}
const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
}
const parseCsv = (text) => {
  const rows = []; let row = []; let cell = ""; let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"' && quoted && text[i + 1] === '"') { cell += char; i += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === "," && !quoted) { row.push(cell); cell = "" }
    else if (char === "\n" && !quoted) { row.push(cell); rows.push(row); row = []; cell = "" }
    else if (char !== "\r") cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const [headers, ...values] = rows
  return values.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}
const slugify = (value) => value.toLowerCase().replace(/\([^)]*\)/g, "").replace(/\s+-\s+[A-Z0-9]+\s+-\s+(?:US|GB|JP)$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const cleanTitle = (title, code) => title.replace(/\s+-\s+(?:Men's|Women's)\s+-\s+[A-Z0-9]+\s+-\s+(?:US|GB|JP)$/i, "").replace(new RegExp(`\\s+-\\s+${code}\\s+-\\s+(?:US|GB|JP)$`, "i"), "").replace(/\s+-\s+(?:US|GB|JP)$/i, "").trim()
const lineTagFor = (title) => title.includes("Handball Spezial") ? "adidas-handball-spezial" : title.includes("Samba OG") ? "adidas-samba-og" : title.includes("Gazelle") ? "adidas-gazelle" : "adidas"
const getColours = (colourway) => [...new Set((colourway || "").toLowerCase().split(/[^a-z]+/).filter((word) => ["black", "white", "grey", "gray", "green", "blue", "pink", "red", "brown", "silver", "purple", "orange", "yellow", "cream", "beige", "navy", "olive"].includes(word)).map((word) => word === "gray" ? "grey" : word))]

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error("Missing MEDUSA_ADMIN_API_KEY")
const request = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, { ...options, headers: { Authorization: `Basic ${apiKey}`, ...(options.headers || {}) } })
  const text = await response.text(); const body = text ? JSON.parse(text) : {}
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url}: ${response.status} ${text.slice(0, 500)}`)
  return body
}
const upload = async (file) => {
  const form = new FormData(); form.append("files", new File([await fs.readFile(file)], path.basename(file), { type: "image/jpeg" }))
  const response = await fetch(`${BACKEND_URL}/admin/uploads`, { method: "POST", headers: { Authorization: `Basic ${apiKey}` }, body: form })
  const body = await response.json(); if (!response.ok) throw new Error(`Upload ${response.status}`); return body.files[0].url
}
const allProducts = []
for (let offset = 0; ; offset += 100) { const page = await request(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,metadata`); allProducts.push(...page.products); if (page.products.length < 100) break }
const existingCodes = new Set(allProducts.flatMap((product) => [product.external_id, product.metadata?.product_code, product.metadata?.style_code].filter(Boolean).map(String)))
const tagsPage = await request("/admin/product-tags?limit=1000")
const tags = new Map((tagsPage.product_tags || tagsPage.tags || []).map((tag) => [tag.value, tag]))
const tag = async (value) => { if (!tags.has(value)) { const body = await request("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) }); tags.set(value, body.product_tag || body.tag) } return tags.get(value) }

const rows = parseCsv(await fs.readFile(REVIEW_PATH, "utf8"))
const stockx = JSON.parse(await fs.readFile(STOCKX_PATH, "utf8")).results
const byCode = new Map(stockx.filter((item) => item?.stockx_url && item.stockx_title && !/\/brands\/|Buy and Sell/.test(`${item.stockx_url} ${item.stockx_title}`)).map((item) => [item.code, item]))
const report = { started_at: new Date().toISOString(), created: [], skipped: [], failed: [] }
for (const [code, match] of byCode) {
  const row = rows.find((candidate) => candidate.product_code === code)
  if (!row) continue
  if (existingCodes.has(code)) { report.skipped.push({ code, reason: "existing product code" }); continue }
  const title = cleanTitle(match.stockx_title, code)
  const lineTag = lineTagFor(title); const colourway = match.stockx_colourway || title.replace(/^adidas\s+(?:Gazelle Indoor|Gazelle Bold|Samba OG|Handball Spezial|Samba Mule|Samba Jane)\s*/i, "")
  const colourTags = getColours(colourway).map((colour) => `colour:${colour}`)
  try {
    const imageFiles = (await fs.readdir(row.local_folder)).filter((file) => /\.jpe?g$/i.test(file)).sort().slice(0, 8).map((file) => path.join(row.local_folder, file))
    if (imageFiles.length < 8) throw new Error(`Only ${imageFiles.length} local images`)
    const imageUrls = []; for (const file of imageFiles) imageUrls.push(await upload(file))
    const sizes = Object.entries(SIZE_MAP).map(([eu, [men, women]]) => ({ eu, men, women, display: `M ${men} / W ${women}` }))
    const productTags = []; for (const value of ["adidas", lineTag, ...colourTags]) productTags.push(await tag(value))
    const product = await request("/admin/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      title, subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end", handle: slugify(`${title}-${code}`), status: "draft", discountable: true, weight: 400,
      description: `${title}.\n\nStyle ${code}. Colourway verified against the linked StockX product page.`, external_id: `YUP-ADIDAS-20260619-${code}`,
      thumbnail: imageUrls[0], images: imageUrls.map((url) => ({ url })), options: [{ title: "Size", values: sizes.map(({ display }) => display) }],
      variants: sizes.map((size) => ({ title: size.display, sku: `MUSE-ADIDAS-${code}-${size.eu}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(), allow_backorder: true, manage_inventory: false, weight: 400, options: { Size: size.display }, prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: 140 })), metadata: { eu_size: size.eu, us_mens_size: size.men, us_womens_size: size.women, display_size: size.display, size_system: "adidas-us-men-women", source_size_system: "eu" } })),
      shipping_profile_id: IDS.shippingProfile, collection_id: IDS.collection, categories: [{ id: IDS.category }], type_id: IDS.productType, tags: productTags.map(({ id }) => ({ id })), sales_channels: [{ id: IDS.salesChannel }],
      metadata: { source: "yupoo", source_url: row.source_url, source_title: row.source_title, product_code: code, brand: "adidas", stockx_source_url: match.stockx_url, stockx_title: match.stockx_title, stockx_colourway: match.stockx_colourway || "", colourway, line_tag: lineTag, source_size_system: "eu", display_size_system: "adidas-us-men-women", size_display_note: "Sizes are shown as US Men's / US Women's.", size_chart: "adidas-adult-us-men-women", fit_sized_down_percent: "1", fit_true_to_size_percent: "88", fit_sized_up_percent: "11" },
    }) })
    report.created.push({ code, product_id: product.product?.id, title, image_count: imageUrls.length, variant_count: sizes.length, stockx: match.stockx_url }); existingCodes.add(code); console.log(`Created ${code}: ${title}`)
  } catch (error) { report.failed.push({ code, error: error.message }); console.error(`Failed ${code}: ${error.message}`) }
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
}
report.finished_at = new Date().toISOString(); await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2)); console.log(`Wrote ${REPORT_PATH}`)
