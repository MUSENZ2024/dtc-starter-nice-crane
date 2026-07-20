import fs from "node:fs/promises"
import path from "node:path"

const ROOT = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE"
const SOURCE = "/Users/mrburns_mac/Downloads/products_Jul-20_08-55-30PM.csv"
const OUT = path.join(ROOT, "medusa-imports/squarespace-north-face-jul-20")
const BACKEND = "https://appealing-quince-change.medusajs.app"
const DRY_RUN = process.argv.includes("--dry-run")
const IDS = {
  shipping: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  sales: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  type: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HX8KBZGS9MRFV4SZJ0FJP",
  location: "sloc_01KT3GK161B1CZ6R1M4HB4MZSB",
}

const parseCsv = (text) => {
  const rows = []; let row = [], value = "", quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quoted && c === '"' && text[i + 1] === '"') { value += c; i++; continue }
    if (c === '"') { quoted = !quoted; continue }
    if (!quoted && c === ",") { row.push(value); value = ""; continue }
    if (!quoted && (c === "\n" || c === "\r")) { if (c === "\r" && text[i + 1] === "\n") i++; row.push(value); rows.push(row); row = []; value = ""; continue }
    value += c
  }
  if (value || row.length) { row.push(value); rows.push(row) }
  const [headers, ...data] = rows
  return data.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])))
}
const slug = (s) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const normalSize = (s) => s.toUpperCase()
const rows = parseCsv(await fs.readFile(SOURCE, "utf8"))
const groups = []; let current
for (const row of rows) {
  if (row["Product ID [Non Editable]"]) {
    current = { id: row["Product ID [Non Editable]"], handle: row["Product URL"], title: row.Title, description: row.Description, price: Number(row["Sale Price"] || row.Price), images: (row["Hosted Image URLs"] || "").trim().split(/\s+/).filter(Boolean), variants: [] }
    groups.push(current)
  }
  current?.variants.push({ colour: row["Option Value 1"], size: normalSize(row["Option Value 2"]), sku: row.SKU })
}
const sourceProducts = [
  { kind: "jacket", source: groups.find((g) => g.handle === "the-north-face-1996-retro-nuptse-jacket-black"), title: "The North Face 1996 Retro Nuptse Jacket", handle: "the-north-face-1996-retro-nuptse-jacket", modelTag: "the-north-face-full-jacket" },
  { kind: "vest", source: groups.find((g) => g.handle === "the-north-face-unisex-1996-retro-nuptse-vest-black"), extra: groups.find((g) => g.handle === "the-north-face-unisex-1996-retro-nuptse-vest-navy-blue"), title: "The North Face 1996 Retro Nuptse Vest", handle: "the-north-face-1996-retro-nuptse-vest", modelTag: "the-north-face-vest" },
]
if (sourceProducts.some((p) => !p.source)) throw new Error("Required jacket or vest source group is missing")

await fs.mkdir(OUT, { recursive: true })
const key = (await fs.readFile(path.join(ROOT, "muse-medusa-store/.image-upload.env"), "utf8")).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!key) throw new Error("Missing Medusa Admin API key")
const api = async (route, options = {}) => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(BACKEND + route, { ...options, headers: { Authorization: `Basic ${key}`, ...(options.headers || {}) }, signal: AbortSignal.timeout(90000) })
    const text = await response.text(); let body
    try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
    if (response.ok) return body
    if (attempt === 4 || response.status < 500) throw new Error(`${options.method || "GET"} ${route} ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
    await new Promise((r) => setTimeout(r, attempt * 1500))
  }
}
const upload = async (url, name) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(45000) }); if (!r.ok) throw new Error(`Image ${r.status}: ${url}`)
  const type = r.headers.get("content-type") || "image/jpeg"; const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg"
  const form = new FormData(); form.append("files", new File([await r.arrayBuffer()], `${slug(name)}.${ext}`, { type }))
  return (await api("/admin/uploads", { method: "POST", body: form })).files[0].url
}
const allTags = []
for (let offset = 0; ; offset += 100) {
  const page = (await api(`/admin/product-tags?limit=100&offset=${offset}`)).product_tags
  allTags.push(...page)
  if (page.length < 100) break
}
const tagMap = new Map(allTags.map((t) => [t.value, t]))
const ensureTag = async (value) => {
  if (tagMap.has(value)) return tagMap.get(value)
  if (DRY_RUN) return { id: `dry-${value}`, value }
  const result = await api("/admin/product-tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) })
  const tag = result.product_tag; tagMap.set(value, tag); return tag
}
const report = { started_at: new Date().toISOString(), dry_run: DRY_RUN, source: SOURCE, products: [] }

for (const spec of sourceProducts) {
  const colours = [...new Set(spec.source.variants.map((v) => v.colour).filter(Boolean))]
  const sizes = [...new Set(spec.source.variants.map((v) => v.size).filter(Boolean))]
  let imageSources = [...spec.source.images]
  if (spec.kind === "vest" && imageSources.length < 23) imageSources.push(...(spec.extra?.images || []).filter((u) => !imageSources.includes(u)).slice(0, 23 - imageSources.length))
  if (imageSources.length !== 23) throw new Error(`${spec.kind}: expected exactly 23 source images, got ${imageSources.length}`)
  const variants = colours.flatMap((colour) => sizes.map((size) => ({ colour, size })))
  const duplicate = (await api(`/admin/products?handle=${encodeURIComponent(spec.handle)}&fields=id,title,handle,external_id,*images,*variants,*variants.inventory_items,*variants.options,*variants.images,+variants.metadata`)).products?.[0]
  if (duplicate && !DRY_RUN) {
    const duplicateImageByUrl = new Map(duplicate.images.map((image) => [image.url, image]))
    for (const variant of duplicate.variants) {
      const colour = variant.metadata?.colour
      const size = variant.metadata?.size
      const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
      if (!itemId) throw new Error(`${variant.id}: inventory item missing during reconciliation`)
      const colourImage = duplicateImageByUrl.get(variant.metadata?.colour_image_url)
      if (colourImage && !variant.images?.some((image) => image.id === colourImage.id)) {
        await api(`/admin/products/${duplicate.id}/variants/${variant.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ images: [{ id: colourImage.id }] }) })
      }
      const detail = (await api(`/admin/inventory-items/${itemId}?fields=id,*location_levels`)).inventory_item
      if (!detail.location_levels?.some((level) => level.location_id === IDS.location)) {
        const stocked_quantity = size === "XXL" && colour?.toLowerCase() !== "black" ? 0 : 100
        await api(`/admin/inventory-items/${itemId}/location-levels`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ location_id: IDS.location, stocked_quantity }) })
      }
    }
    report.products.push({ kind: spec.kind, status: "reconciled_existing", product_id: duplicate.id, handle: duplicate.handle, colours, sizes, variants: duplicate.variants.length, images: duplicate.images.length })
    continue
  }
  if (DRY_RUN) { report.products.push({ kind: spec.kind, status: "dry_run_create", colours, sizes, variants: variants.length, images: imageSources.length, unavailable: variants.filter((v) => v.size === "XXL" && v.colour.toLowerCase() !== "black").length }); continue }
  const uploaded = []
  for (const [i, url] of imageSources.entries()) uploaded.push(await upload(url, `${spec.handle}-${i + 1}`))
  const colourHero = new Map()
  const filenameIndex = (needle) => imageSources.findIndex((u) => decodeURIComponent(u).toLowerCase().includes(needle))
  for (const colour of colours) {
    const keyColour = colour.toLowerCase().replace("dark ", "").replace("light ", "").replace(" & black", "").replace(" & white", "")
    let index = filenameIndex(`the+${keyColour}+`)
    if (index < 0) index = filenameIndex(`with+the+${keyColour}+`)
    if (index < 0) index = colour.toLowerCase() === "black" ? Math.min(11, uploaded.length - 1) : 0
    colourHero.set(colour, uploaded[index])
  }
  const tagValues = ["the-north-face", spec.modelTag, "nuptse-drop", "winter-drop", "new-arrival", ...colours.map((c) => `colour:${slug(c).replace("-and-black", "").replace("-and-white", "")}`)]
  const tags = []; for (const value of [...new Set(tagValues)]) tags.push(await ensureTag(value))
  const payload = {
    title: spec.title, handle: spec.handle, subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end", description: spec.source.description,
    status: "published", discountable: true, weight: 600, external_id: `SQ-TNF-${spec.kind.toUpperCase()}-JUL20`, thumbnail: uploaded[0], images: uploaded.map((url) => ({ url })),
    options: [{ title: "Color", values: colours }, { title: "Size", values: sizes }],
    variants: variants.map(({ colour, size }, rank) => ({ title: `${colour} / ${size}`, sku: `MUSE-TNF-${spec.kind.toUpperCase()}-${slug(colour).toUpperCase()}-${size}`, manage_inventory: true, allow_backorder: false, weight: 600, variant_rank: rank, options: { Color: colour, Size: size }, prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: spec.source.price })), metadata: { colour, size, availability_rule: size === "XXL" && colour.toLowerCase() !== "black" ? "unavailable_non_black_xxl" : "available", colour_image_url: colourHero.get(colour) } })),
    shipping_profile_id: IDS.shipping, sales_channels: [{ id: IDS.sales }], collection_id: IDS.collection, type_id: IDS.type, categories: [{ id: IDS.category }], tags: tags.map((t) => ({ id: t.id })),
    metadata: { source: "squarespace", source_export: SOURCE, squarespace_product_id: spec.source.id, brand: "The North Face", model: spec.kind === "jacket" ? "1996 Retro Nuptse Jacket" : "1996 Retro Nuptse Vest", display_size_system: "us_unisex", size_display_note: "US unisex sizing. Women generally size down.", image_source_policy: "Uploaded to Medusa from user-supplied Squarespace export", squarespace_image_count: imageSources.length, colour_image_map: Object.fromEntries(colourHero), grouped_colours: true, xxl_rule: "XXL is available only in Black." }
  }
  const created = (await api("/admin/products?fields=id,title,handle,*images,*variants,*variants.inventory_items,*variants.options,metadata", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })).product
  const imageByUrl = new Map(created.images.map((i) => [i.url, i]))
  for (const variant of created.variants) {
    const colour = variant.options.find((o) => o.option?.title === "Color" || o.value === variant.metadata?.colour)?.value || variant.metadata?.colour
    const size = variant.options.find((o) => o.option?.title === "Size")?.value || variant.metadata?.size
    const image = imageByUrl.get(colourHero.get(colour))
    if (image) await api(`/admin/products/${created.id}/variants/${variant.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ images: [{ id: image.id }] }) })
    const itemId = variant.inventory_items?.[0]?.inventory_item_id || variant.inventory_items?.[0]?.id
    if (!itemId) throw new Error(`${variant.id}: inventory item missing`)
    const stocked_quantity = size === "XXL" && colour?.toLowerCase() !== "black" ? 0 : 100
    await api(`/admin/inventory-items/${itemId}/location-levels`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ location_id: IDS.location, stocked_quantity }) })
  }
  report.products.push({ kind: spec.kind, status: "created", product_id: created.id, handle: created.handle, colours, sizes, variants: created.variants.length, images: created.images.length })
  await fs.writeFile(path.join(OUT, "import-report.json"), JSON.stringify(report, null, 2))
}
report.finished_at = new Date().toISOString()
await fs.writeFile(path.join(OUT, "import-report.json"), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
