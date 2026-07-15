import fs from "node:fs/promises"
import path from "node:path"

const ROOT = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE"
const BASE_DIR = path.join(ROOT, "medusa-imports/yupoo-ugg-4679819")
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(BASE_DIR, "ugg-enriched-review.csv")
const REPORT_PATH = path.join(BASE_DIR, "medusa-import-report.json")
const BACKEND = "https://appealing-quince-change.medusajs.app"
const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const env = Object.fromEntries((await fs.readFile(path.resolve(".image-upload.env"), "utf8")).split("\n").filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)))
if (!env.MEDUSA_ADMIN_API_KEY) throw new Error("MEDUSA_ADMIN_API_KEY is missing from .image-upload.env")

const sourceCategory = "https://yolo66.x.yupoo.com/categories/4679819"
const ids = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  category: "pcat_01KT3HVWSHGSW3S0CW47QYQS4E",
}
const verified = {
  "1167430-BLK": { model: "GoldenGlow Slide", colourway: "Black", colours: ["black"], source: "StockX", sizes: ["36", "37", "38", "39", "40"] },
  "1167430-SNPK": { model: "GoldenGlow Slide", colourway: "Sun Pink", colours: ["pink"], source: "StockX", sizes: ["36", "37", "38", "39", "40"] },
  "1152685-BLK": { model: "GoldenGlow Sandal", colourway: "Black", colours: ["black"], source: "StockX", sizes: ["36", "37", "38", "39", "40"] },
  "1152685-MGS": { model: "GoldenGlow Sandal", colourway: "Mangosteen", colours: ["purple"], source: "StockX", sizes: ["36", "37", "38", "39", "40"] },
  "1152685-SSAL": { model: "GoldenGlow Sandal", colourway: "Sea Salt", colours: ["cream", "beige"], source: "StockX", sizes: ["36", "37", "38", "39", "40"] },
  "1152685-CTRP": { model: "GoldenGlow Sandal", colourway: "Caterpillar", colours: ["green"], source: "KicksCrew/Reversible", sizes: ["36", "37", "38", "39", "40"] },
  "1152813K-BRWN": { model: "GoldenGlow Sandal Kids", colourway: "Bison Brown", colours: ["brown"], source: "UGG Brazil/Sneaker Squad", sizes: ["36", "37", "38", "39", "40"] },
}
const inferredModels = {
  "016422": ["Classic Short Boot", "boots"], "1015125": ["Tasman Slipper", "sandals"], "1016222": ["Classic Mini II Boot", "boots"], "1016422": ["Mini Bailey Button II Boot", "boots"], "1115092": ["Classic Ultra Mini Platform", "boots"], "1116109": ["Classic Ultra Mini Boot", "boots"], "1122550": ["Disquette Slipper", "sandals"], "1122553": ["Tazz Slipper", "sandals"], "1130750": ["Classic Ultra Mini Kids", "boots"], "1134810": ["Tazzette Slipper", "sandals"], "1135013": ["Classic Mini Quickclick Boot", "boots"], "11350925": ["Classic Ultra Mini Platform", "boots"], "1143991": ["Neumel Weather Hybrid Boot", "boots"], "1144032": ["Lowmel", "sneakers"], "1144096": ["Tasman Weather Hybrid", "sandals"], "1145390": ["Highmel", "sneakers"], "1152050": ["CityFunc Chelsea Boot", "boots"], "1158351": ["Tasman Weather Hybrid", "sandals"], "1168170": ["Classic Mini Dipper Boot", "boots"], "1172170": ["Lowmel", "sneakers"], "2553": ["Palace x Tasman", "sandals"], "5955": ["Tasman Slipper", "sandals"], "6109": ["Classic Mini Boot", "boots"], "6223": ["Classic Ultra Mini Platform", "boots"]
}
const colourWords = [[/黑白|白黑/, ["Black White", ["black", "white"]]], [/黑色/, ["Black", ["black"]]], [/栗色|胡桃|羚羊棕|棕色|棕绿/, ["Chestnut", ["brown"]]], [/灰色|灰/, ["Grey", ["grey"]]], [/绿色|绿/, ["Green", ["green"]]], [/蓝色|蓝/, ["Blue", ["blue"]]], [/黄色|菜籽/, ["Yellow", ["yellow"]]], [/橘色/, ["Orange", ["orange"]]], [/沙色/, ["Sand", ["beige", "cream"]]], [/白色/, ["White", ["white"]]]]
const inferredInfo = (album) => {
  const entry = inferredModels[album.product_code]
  if (!entry) return null
  const colour = colourWords.find(([pattern]) => pattern.test(album.source_title))?.[1] || ["Colourway", ["brown"]]
  const category = entry[1] === "boots" ? "pcat_01KT3HTPTCWGZ4G8Y5WTGP42C5" : entry[1] === "sneakers" ? "pcat_01KT3HFA42VKPWG91CVBR33XA8" : "pcat_01KT3HVWSHGSW3S0CW47QYQS4E"
  const range = album.source_title.match(/(\d{2})\s*[-–]\s*(\d{2})/)
  const sizes = range ? Array.from({ length: Number(range[2]) - Number(range[1]) + 1 }, (_, i) => String(Number(range[1]) + i)) : ["36", "37", "38", "39", "40"]
  return { model: entry[0], colourway: colour[0], colours: colour[1], source: "StockX/public model lookup + Yupoo title", sizes, category, confidence: "partial" }
}
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const csv = (value) => { const text = String(value ?? ""); return /[\",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text }
const fetchAdmin = async (route, init = {}) => {
  const response = await fetch(`${BACKEND}${route}`, { ...init, headers: { authorization: `Basic ${env.MEDUSA_ADMIN_API_KEY}`, ...(init.headers || {}) }, signal: AbortSignal.timeout(90000) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${init.method || "GET"} ${route}: ${response.status} ${JSON.stringify(body)}`)
  return body
}
const listAll = async (route, key, fields = "") => {
  const values = []
  for (let offset = 0; ; offset += 100) {
    const body = await fetchAdmin(`${route}?limit=100&offset=${offset}${fields ? `&fields=${encodeURIComponent(fields)}` : ""}`)
    const page = body[key] || []
    values.push(...page)
    if (page.length < 100) return values
  }
}
const description = (info) => `The UGG ${info.model} in ${info.colourway} pairs a lightweight, easy-wearing silhouette with adjustable comfort for everyday warm-weather rotation.\n\nIts durable construction and cushioned underfoot feel make it a relaxed option for day-to-day wear, while the ${info.colourway} colourway gives the pair a distinct finish.\n\nSizes are shown as EU buttons.`

const raw = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
const products = await listAll("/admin/products", "products", "id,title,handle,external_id,metadata,tags")
const tags = await listAll("/admin/product-tags", "product_tags")
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const ensureTag = async (value) => {
  if (tagByValue.has(value)) return tagByValue.get(value)
  if (dryRun) return { id: `dry-${value}`, value }
  const body = await fetchAdmin("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) })
  const tag = body.product_tag || body.tag
  tagByValue.set(value, tag)
  return tag
}
const report = { started_at: new Date().toISOString(), dry_run: dryRun, source_category: sourceCategory, created: [], skipped: [], needs_review: [] }
const seenHandles = new Set(products.map((product) => product.handle).filter(Boolean))
const review = [["product_code", "product_name", "brand", "model", "colourway", "primary_colour", "secondary_colour", "colour_family", "colour_tags", "seo_title", "meta_description", "url_slug", "product_details", "source_url", "source_title", "colour_source", "colour_confidence", "local_folder", "local_image_count", "medusa_product_id", "medusa_handle", "import_status", "notes"]]

for (const album of raw) {
  const info = verified[album.product_code] ? { ...verified[album.product_code], category: ids.category, confidence: "verified" } : inferredInfo(album)
  const code = album.product_code || ""
  const title = info ? `UGG ${info.model} - ${info.colourway}` : ""
  const handle = info ? slugify(`ugg-${info.model}-${info.colourway}-${code}${verified[code] ? "" : `-${album.index + 1}`}`) : ""
  const sourceAlbumId = album.source_url.match(/albums\/(\d+)/)?.[1] || album.index
  const externalId = `YUP4679819-${sourceAlbumId}`
  const exists = info && (seenHandles.has(handle) || products.find((product) => [product.title, product.handle, product.external_id].filter(Boolean).some((value) => String(value).toLowerCase() === handle || String(value).toLowerCase() === externalId.toLowerCase())))
  let status = "needs_review"
  let notes = "No exact public colourway match recorded; intentionally excluded from import."
  if (info && (album.local_images || []).length < 8) { notes = "Fewer than 8 local images; intentionally excluded from import." }
  if (info && exists) { status = "skipped_existing"; notes = `Existing Medusa product found: ${exists.id} ${exists.handle}` }
  if (info && !exists && (album.local_images || []).length >= 8) status = dryRun ? "dry_run_create" : "create"
  const colourTags = info ? info.colours.map((colour) => `colour:${colour}`) : []
  review.push([code, title, "UGG", info?.model || "", info?.colourway || "", info?.colours[0] || "", info?.colours[1] || "", info?.colours.join(" | ") || "", colourTags.join(" | "), info ? `${title} | MUSE NZ` : "", info ? `Shop ${title} at MUSE NZ.` : "", handle, info ? description(info) : "", album.source_url, album.source_title, info?.source || "", info?.confidence || "needs review", album.local_folder, album.local_images?.length || 0, exists?.id || "", exists?.handle || handle, status, notes])
  if (status !== "create" && status !== "dry_run_create") { (status === "needs_review" ? report.needs_review : report.skipped).push({ code, title, status, notes }); continue }
  const productTags = []
  for (const value of ["ugg", "ugg-goldenglow", ...colourTags]) productTags.push(await ensureTag(value))
  const imageUrls = album.image_urls.slice(0, 8)
  const variants = info.sizes.map((size) => ({ title: size, sku: `MUSE-UGG-YUP4679819-${sourceAlbumId}-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(), allow_backorder: true, manage_inventory: false, weight: 400, options: { Size: size }, prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: 140 })), metadata: { eu_size: size, display_size: size, size_system: "eu" } }))
  const payload = { title, subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end", handle, description: description(info), status: "published", discountable: true, weight: 400, external_id: externalId, thumbnail: imageUrls[0], images: imageUrls.map((url) => ({ url })), options: [{ title: "Size", values: info.sizes }], variants, shipping_profile_id: ids.shippingProfile, collection_id: ids.collection, categories: [{ id: info.category }], tags: productTags.map((tag) => ({ id: tag.id })), sales_channels: [{ id: ids.salesChannel }], metadata: { source: "yupoo", source_url: album.source_url, source_title: album.source_title, source_category: sourceCategory, product_code: code, source_album_id: sourceAlbumId, brand: "UGG", model: info.model, colourway: info.colourway, colour_tags: colourTags.join(" | "), colour_confidence: info.confidence, colour_source: info.source, source_size_system: "eu", display_size_system: "eu", size_display_note: "Sizes are shown as EU buttons." } }
  if (dryRun) { seenHandles.add(handle); report.created.push({ code, title, handle, price: 140, image_count: imageUrls.length, variant_count: variants.length, category: info.category }); continue }
  const body = await fetchAdmin("/admin/products?fields=id,title,handle,external_id,*images,*variants,*tags,metadata", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
  seenHandles.add(handle)
  report.created.push({ product_id: body.product?.id, code, title: body.product?.title, handle: body.product?.handle, price: 140, image_count: body.product?.images?.length, variant_count: body.product?.variants?.length, category: info.category })
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
}
report.finished_at = new Date().toISOString()
await fs.writeFile(REVIEW_PATH, review.map((row) => row.map(csv).join(",")).join("\n"))
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ created: report.created.length, skipped: report.skipped.length, needs_review: report.needs_review.length, review: REVIEW_PATH, report: REPORT_PATH }, null, 2))
