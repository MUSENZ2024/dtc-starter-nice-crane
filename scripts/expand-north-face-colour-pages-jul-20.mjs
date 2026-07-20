import fs from "node:fs/promises"
import path from "node:path"

const ROOT = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE"
const BACKEND = "https://appealing-quince-change.medusajs.app"
const OUT = path.join(ROOT, "medusa-imports/squarespace-north-face-jul-20")
const REPORT = path.join(OUT, "colour-pages-import-report.json")
const DRY_RUN = process.argv.includes("--dry-run")
const IDS = {
  jacket: "prod_01KXZDBJNAMNWC98KGTP343EGK",
  vest: "prod_01KXZDMK7JZ8MCRAF8J5KW3C4X",
  shipping: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  sales: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  type: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HX8KBZGS9MRFV4SZJ0FJP",
}

const DESCRIPTION = `Inspired by the original 1996 Nuptse design, this jacket features a boxy, oversized silhouette that has become a staple in both streetwear and outdoor wear.

Constructed with a durable ripstop outer, it offers reliable protection against everyday wear while maintaining a lightweight and comfortable feel. The all-black colourway keeps the look clean, minimal, and easy to style across any outfit.

Filled with high-quality insulation, it provides exceptional warmth without unnecessary bulk, making it ideal for colder conditions while still being versatile enough for daily wear.

Finished with signature The North Face branding and a classic puffer construction, this jacket delivers a strong balance of function, warmth, and timeless design.`

const CONFIG = {
  jacket: {
    baseId: IDS.jacket,
    model: "1996 Retro Nuptse Jacket",
    handlePrefix: "nuptse-jacket",
    modelTag: "the-north-face-full-jacket",
    colours: ["Navy blue", "Black", "Dark Green", "Purple", "Blue", "Brown", "White & Black", "Orange", "Olive", "Pink", "Grey", "Baby Blue", "Cream & White"],
    handles: { "Navy blue": "navy", Black: "black", "Dark Green": "dark-green", Purple: "purple", Blue: "blue", Brown: "brown", "White & Black": "white-black", Orange: "orange", Olive: "olive", Pink: "pink", Grey: "grey", "Baby Blue": "baby-blue", "Cream & White": "cream-white" },
    imageIndexes: { "Navy blue": 11, Black: 0, "Dark Green": 12, Purple: 13, Blue: 14, Brown: 15, "White & Black": 16, Orange: 17, Olive: 18, Pink: 19, Grey: 21, "Baby Blue": 20, "Cream & White": 22 },
  },
  vest: {
    baseId: IDS.vest,
    model: "1996 Retro Nuptse Vest",
    handlePrefix: "nuptse-vest",
    modelTag: "the-north-face-vest",
    colours: ["Navy Blue", "White", "Orange", "Yellow", "Light Blue", "Purple", "Red", "Grey", "Green", "Olive", "Pink", "Black"],
    handles: { "Navy Blue": "navy", White: "white", Orange: "orange", Yellow: "yellow", "Light Blue": "light-blue", Purple: "purple", Red: "red", Grey: "grey", Green: "green", Olive: "olive", Pink: "pink", Black: "black" },
    imageIndexes: { "Navy Blue": 16, White: 19, Orange: 17, Yellow: 18, "Light Blue": 10, Purple: 8, Red: 9, Grey: 13, Green: 11, Olive: 14, Pink: 15, Black: 0 },
  },
}

const slug = (value) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const key = (await fs.readFile(path.join(ROOT, "muse-medusa-store/.image-upload.env"), "utf8")).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!key) throw new Error("Missing Medusa Admin API key")
const api = async (route, options = {}) => {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(BACKEND + route, { ...options, headers: { Authorization: `Basic ${key}`, ...(options.headers || {}) }, signal: AbortSignal.timeout(120000) })
    const text = await response.text(); let body
    try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
    if (response.ok) return body
    if (attempt === 5 || response.status < 500) throw new Error(`${options.method || "GET"} ${route} ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
  }
}
const post = (route, body) => api(route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
const fetchProduct = async (id) => (await api(`/admin/products/${id}?fields=id,title,handle,status,thumbnail,*images,metadata`)).product
const allTags = []
for (let offset = 0; ; offset += 100) {
  const page = (await api(`/admin/product-tags?limit=100&offset=${offset}`)).product_tags
  allTags.push(...page)
  if (page.length < 100) break
}
const tagMap = new Map(allTags.map((tag) => [tag.value, tag]))
const ensureTag = async (value) => {
  if (tagMap.has(value)) return tagMap.get(value)
  if (DRY_RUN) return { id: `dry-${value}`, value }
  const tag = (await post("/admin/product-tags", { value })).product_tag
  tagMap.set(value, tag)
  return tag
}

await fs.mkdir(OUT, { recursive: true })
const report = { started_at: new Date().toISOString(), dry_run: DRY_RUN, description: DESCRIPTION, created: [], skipped_existing: [], source_products_retired: [] }

for (const [kind, config] of Object.entries(CONFIG)) {
  const base = await fetchProduct(config.baseId)
  if (base.images?.length !== 23) throw new Error(`${kind}: expected 23 Medusa images, received ${base.images?.length}`)
  const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL"]
  const imageByColour = Object.fromEntries(config.colours.map((colour) => [colour, base.images[config.imageIndexes[colour]]]))
  if (Object.values(imageByColour).some((image) => !image?.url)) throw new Error(`${kind}: incomplete colour image mapping`)
  const tagValues = ["the-north-face", config.modelTag, "nuptse-drop", "winter-drop", "new-arrival", ...config.colours.map((colour) => `colour:${slug(colour).replace("-and-black", "").replace("-and-white", "")}`)]
  const tags = []; for (const value of [...new Set(tagValues)]) tags.push(await ensureTag(value))

  for (const pageColour of config.colours) {
    const handle = `${config.handlePrefix}-${config.handles[pageColour]}`
    const existing = (await api(`/admin/products?handle=${encodeURIComponent(handle)}&fields=id,title,handle,status,external_id`)).products?.[0]
    if (existing) {
      report.skipped_existing.push({ kind, colour: pageColour, handle, product_id: existing.id })
      continue
    }
    const orderedColours = [pageColour, ...config.colours.filter((colour) => colour !== pageColour)]
    const orderedImages = [imageByColour[pageColour], ...base.images.filter((image) => image.id !== imageByColour[pageColour].id)]
    if (DRY_RUN) {
      report.created.push({ kind, colour: pageColour, handle, status: "dry_run_create", variants: orderedColours.length * sizes.length, images: orderedImages.length, default_image: imageByColour[pageColour].url })
      continue
    }
    const variants = orderedColours.flatMap((colour) => sizes.map((size, index) => {
      const unavailable = size === "XXL" && colour.toLowerCase() !== "black"
      return {
        title: `${colour} / ${size}`,
        sku: `MUSE-TNF-${kind.toUpperCase()}-${slug(pageColour).toUpperCase()}-${slug(colour).toUpperCase()}-${size}`,
        manage_inventory: unavailable,
        allow_backorder: !unavailable,
        weight: 600,
        variant_rank: orderedColours.indexOf(colour) * sizes.length + index,
        options: { Color: colour, Size: size },
        prices: ["nzd", "usd", "eur"].map((currency_code) => ({ currency_code, amount: 180 })),
        metadata: { colour, size, page_colour: pageColour, colour_image_url: imageByColour[colour].url, availability_rule: unavailable ? "unavailable_non_black_xxl" : "standard_delivery_available" },
      }
    }))
    const payload = {
      title: `The North Face ${config.model} - ${pageColour}`,
      handle,
      subtitle: "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
      description: DESCRIPTION,
      status: "published",
      discountable: true,
      weight: 600,
      external_id: `TNF-${kind.toUpperCase()}-${slug(pageColour).toUpperCase()}`,
      thumbnail: imageByColour[pageColour].url,
      images: orderedImages.map((image) => ({ url: image.url })),
      options: [{ title: "Color", values: orderedColours, ranks: Object.fromEntries(orderedColours.map((colour, rank) => [colour, rank])) }, { title: "Size", values: sizes, ranks: Object.fromEntries(sizes.map((size, rank) => [size, rank])) }],
      variants,
      shipping_profile_id: IDS.shipping,
      sales_channels: [{ id: IDS.sales }],
      collection_id: IDS.collection,
      type_id: IDS.type,
      categories: [{ id: IDS.category }],
      tags: tags.map((tag) => ({ id: tag.id })),
      metadata: { source: "squarespace_north_face_jul_20", brand: "The North Face", model: config.model, page_colour: pageColour, grouped_colour_page: true, sibling_colour_count: config.colours.length, display_size_system: "us_unisex", size_display_note: "US unisex sizing. Women generally size down.", image_source_policy: "Medusa-hosted images migrated from user-supplied Squarespace export", image_count: 23, colour_image_map: Object.fromEntries(config.colours.map((colour) => [colour, imageByColour[colour].url])), xxl_rule: "XXL is available only in Black." },
    }
    const created = (await post("/admin/products?fields=id,title,handle,*images,*variants,+variants.metadata", payload)).product
    const createdImageByUrl = new Map(created.images.map((image) => [image.url, image]))
    for (const colour of config.colours) {
      const image = createdImageByUrl.get(imageByColour[colour].url)
      const variantIds = created.variants.filter((variant) => variant.metadata?.colour === colour).map((variant) => variant.id)
      if (!image || variantIds.length !== sizes.length) throw new Error(`${created.id}/${colour}: image or variant grouping mismatch`)
      await post(`/admin/products/${created.id}/images/${image.id}/variants/batch`, { add: variantIds })
    }
    const record = { kind, colour: pageColour, handle, product_id: created.id, title: created.title, variants: created.variants.length, images: created.images.length, default_image: imageByColour[pageColour].url }
    report.created.push(record)
    await fs.writeFile(REPORT, JSON.stringify(report, null, 2))
    console.log(`created ${report.created.length}/25: ${handle}`)
  }
}

if (!DRY_RUN && report.created.length + report.skipped_existing.length === 25) {
  for (const id of [IDS.jacket, IDS.vest]) {
    const product = await fetchProduct(id)
    if (product.status !== "draft") await post(`/admin/products/${id}`, { status: "draft", metadata: { ...product.metadata, replaced_by_individual_colour_pages: true } })
    report.source_products_retired.push({ product_id: id, old_handle: product.handle, status: "draft" })
  }
}
report.finished_at = new Date().toISOString()
await fs.writeFile(REPORT, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ created: report.created.length, skipped_existing: report.skipped_existing.length, retired: report.source_products_retired.length, report: REPORT }, null, 2))
