import fs from "node:fs"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/muse-medusa-store/.image-upload.env"
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-735665/name-tag-fix-report.json"

const env = fs.readFileSync(ENV_PATH, "utf8")
const apiKey = env.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) {
  throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
}

const authHeaders = { Authorization: `Basic ${apiKey}` }
const dryRun = process.argv.includes("--dry-run")

const COLOUR_WORDS = {
  aqua: "blue",
  arctic: "blue",
  bakedpink: "pink",
  barely: null,
  birch: "beige",
  black: "black",
  blue: "blue",
  bright: null,
  carrier: "grey",
  cement: "grey",
  champagne: "gold",
  clay: "grey",
  cloud: "grey",
  coffee: "brown",
  cream: "cream",
  dark: null,
  dolphin: "grey",
  dusk: "purple",
  fawn: "beige",
  fjord: "grey",
  glacier: "grey",
  gold: "gold",
  grape: "purple",
  graphite: "grey",
  grey: "grey",
  green: "green",
  ivory: "cream",
  jasper: "green",
  lime: "green",
  light: null,
  malachite: "green",
  metallic: "silver",
  midnight: "blue",
  mineral: "beige",
  mint: "green",
  mist: "green",
  monaco: "blue",
  navy: "blue",
  obsidian: "grey",
  oyster: "cream",
  peach: "orange",
  pewter: "grey",
  pink: "pink",
  piquant: "orange",
  plum: "purple",
  pure: null,
  red: "red",
  rose: "pink",
  salt: "pink",
  silver: "silver",
  slate: "grey",
  steeple: "grey",
  sweet: "pink",
  tiffany: "blue",
  tuna: "blue",
  violet: "purple",
  waterfall: "blue",
  whisper: "green",
  white: "white",
}

const PRODUCTS = {
  "YUP735665-1203A537-115": { model: "ASICS Gel-Kayano 14", code: "1203A537-115", colourway: "White Light Navy", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-024": { model: "ASICS Gel-Kayano 14", code: "1203A537-024", colourway: "Obsidian Grey Cement", source: "StockX", confidence: "verified" },
  "YUP735665-1203A740-100-1": { model: "ASICS Gel-Kayano 14", code: "1203A740-100", colourway: "Tiffany", fullColourway: "Aqua Blue Metallic Silver", source: "StockX", confidence: "verified" },
  "YUP735665-1202A105-700": { model: "ASICS Gel-Kayano 14", code: "1202A105-700", colourway: "Barely Rose Cream", source: "StockX", confidence: "verified" },
  "YUP735665-1202A105-021": { model: "ASICS Gel-Kayano 14", code: "1202A105-021", colourway: "Glacier Grey Pure Silver", source: "StockX", confidence: "verified" },
  "YUP735665-1202A727-100": { model: "ASICS Gel-Kayano 14", code: "1203A727-100", colourway: "A.P.C. White Pure Silver", fullColourway: "White Pure Silver", source: "scraped box label / StockX nearby code", confidence: "partial", note: "Yupoo title listed 1202A727-100; box label shows 1203A727-100." },
  "YUP735665-1201A019-110": { model: "ASICS Gel-Kayano 14", code: "1201A019-110", colourway: "White Malachite Green", source: "StockX", confidence: "verified" },
  "YUP735665-1202A056-021": { model: "ASICS Gel-Kayano 14", code: "1202A056-021", colourway: "Cloud Grey Clay Grey", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-401": { model: "ASICS Gel-Kayano 14", code: "1203A537-401", colourway: "Dolphin Grey Pure Silver", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-110": { model: "ASICS Gel-Kayano 14", code: "1203A537-110", colourway: "White Graphite Grey", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-105": { model: "ASICS Gel-Kayano 14", code: "1201A019-105", colourway: "Cream Pure Silver", source: "StockX", confidence: "verified" },
  "YUP735665-1202A056-111": { model: "ASICS Gel-Kayano 14", code: "1202A056-111", colourway: "White Dark Grape", source: "StockX", confidence: "verified" },
  "YUP735665-1203A961-101": { model: "ASICS Gel-Kayano 14", code: "1203A961-101", colourway: "JJJJound White Blue", fullColourway: "White Blue", source: "StockX", confidence: "verified" },
  "YUP735665-1202A056-300": { model: "ASICS Gel-Kayano 14", code: "1202A056-300", colourway: "Bright Lime Midnight", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-200": { model: "ASICS Gel-Kayano 14", code: "1201A019-200", colourway: "Birch Dark Pewter", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-105": { model: "ASICS Gel-Kayano 14", code: "1203A537-105", colourway: "Cream Dusk Violet", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-102": { model: "ASICS Gel-Kayano 14", code: "1201A019-102", colourway: "White Pure Gold", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-400": { model: "ASICS Gel-Kayano 14", code: "1203A537-400", colourway: "Arctic Sky Pure Silver", source: "StockX", confidence: "verified" },
  "YUP735665-1203A383-104": { model: "ASICS Gel-NYC", code: "1203A383-104", colourway: "Cream Mineral Beige Pink", fullColourway: "Cream Mineral Beige", source: "StockX", confidence: "verified" },
  "YUP735665-1203A383-107": { model: "ASICS Gel-NYC", code: "1203A383-107", colourway: "Cream Arctic Sky", source: "StockX", confidence: "verified" },
  "YUP735665-1202A105-100": { model: "ASICS Gel-Kayano 14", code: "1202A105-100", colourway: "Cream Pink Salt", source: "StockX", confidence: "verified" },
  "YUP735665-1203A571-100": { model: "ASICS Gel-NYC", code: "1203A571-100", colourway: "Kicki Yang Zhang Pink Cream Pure Silver", fullColourway: "Pink Cream Pure Silver", source: "StockX / Sneakerjagers", confidence: "verified" },
  "YUP735665-1201A019-101": { model: "ASICS Gel-Kayano 14", code: "1201A019-101", colourway: "White Tuna Blue", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-103": { model: "ASICS Gel-Kayano 14", code: "1201A019-103", colourway: "White Classic Red", fullColourway: "White Silver Classic Red", source: "StockX", confidence: "verified" },
  "YUP735665-1201A457-100": { model: "ASICS Gel-Kayano 14", code: "1201A457-100", colourway: "JJJJound Silver White", fullColourway: "White Silver White Cream", source: "StockX", confidence: "verified" },
  "YUP735665-1203A692-100": { model: "ASICS Gel-Kayano 14", code: "1203A692-100", colourway: "Sneaker Politics Just Say No", fullColourway: "Cream Pure Gold", source: "StockX", confidence: "verified" },
  "YUP735665-1202A516-700": { model: "ASICS Gel-Kayano 14", code: "1202A516-700", colourway: "Baked Pink Cream", fullColourway: "Bakedpink Cream", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-107": { model: "ASICS Gel-Kayano 14", code: "1201A019-107", colourway: "White Pure Silver Slate Grey", fullColourway: "White Slate Grey", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-401": { model: "ASICS Gel-Kayano 14", code: "1201A019-401", colourway: "Monaco Blue", fullColourway: "Monaco Blue Black Silver", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-106": { model: "ASICS Gel-Kayano 14", code: "1203A537-106", colourway: "White Fjord Grey", source: "StockX", confidence: "verified" },
  "YUP735665-1203A575-100": { model: "ASICS Gel-Kayano 14", code: "1203A575-100", colourway: "atmos Yakoutake", fullColourway: "Cream Whisper Green", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-108": { model: "ASICS Gel-Kayano 14", code: "1201A019-108", colourway: "Cream Black Metallic Plum", fullColourway: "Cream Black", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-020": { model: "ASICS Gel-Kayano 14", code: "1203A537-020", colourway: "Metropolis Jasper Green", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-250": { model: "ASICS Gel-Kayano 14", code: "1203A537-250", colourway: "Oyster White Steeple Grey", source: "StockX", confidence: "verified" },
  "YUP735665-1203A549-020": { model: "ASICS Gel-Kayano 14", code: "1203A549-020", colourway: "Unlimited Pack Carrier Grey", fullColourway: "Carrier Grey Black", source: "StockX", confidence: "verified" },
  "YUP735665-1203A549-400": { model: "ASICS Gel-Kayano 14", code: "1203A549-400", colourway: "Unlimited Pack Mist Cream", fullColourway: "Mist Cream", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-004": { model: "ASICS Gel-Kayano 14", code: "1201A019-004", colourway: "Black Coffee Silver", source: "StockX", confidence: "verified" },
  "YUP735665-1203A740-100-2": { model: "ASICS Gel-Kayano 14", code: "1203A740-100", colourway: "Tiffany", fullColourway: "Aqua Blue Metallic Silver", source: "StockX", confidence: "verified", duplicate: true },
  "YUP735665-1203A540-020": { model: "ASICS Gel-Kayano 14", code: "1203A540-020", colourway: "Clay Grey Black", source: "StockX", confidence: "verified" },
  "YUP735665-1202A056-109": { model: "ASICS Gel-Kayano 14", code: "1202A056-109", colourway: "White Midnight", source: "StockX", confidence: "verified" },
  "YUP735665-1203A537-103": { model: "ASICS Gel-Kayano 14", code: "1203A537-103", colourway: "Cream Sweet Pink", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-001": { model: "ASICS Gel-Kayano 14", code: "1201A019-001", colourway: "Black Graphite Grey", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-700": { model: "ASICS Gel-Kayano 14", code: "1201A019-700", colourway: "Pink Glo", source: "StockX", confidence: "verified" },
  "YUP735665-1201A457-101": { model: "ASICS Gel-Kayano 14", code: "1201A457-101", colourway: "JJJJound Silver Black", fullColourway: "White Silver Black Cream", source: "StockX", confidence: "verified" },
  "YUP735665-1203A667-100": { model: "ASICS Gel-Kayano 14", code: "1203A667-100", colourway: "Unlimited Pack White Fawn", fullColourway: "White Fawn", source: "StockX", confidence: "verified" },
  "YUP735665-1201A019-006": { model: "ASICS Gel-Kayano 14", code: "1201A019-006", colourway: "Black Pure Silver", source: "StockX", confidence: "verified" },
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  }
  return body
}

const listProducts = async () => {
  const products = []
  for (let offset = 0; offset < 1000; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,description,*tags,metadata`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) break
  }
  return products
}

const listTags = async () => {
  const body = await adminFetch("/admin/product-tags?limit=200")
  return body.product_tags || body.tags || []
}

const ensureTag = async (tagByValue, value) => {
  if (tagByValue.has(value)) {
    return tagByValue.get(value)
  }
  if (dryRun) {
    const fake = { id: `dry-${value}`, value }
    tagByValue.set(value, fake)
    return fake
  }
  const body = await adminFetch("/admin/product-tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value }),
  })
  const tag = body.product_tag || body.tag
  tagByValue.set(value, tag)
  return tag
}

const coloursFor = (item) => {
  const text = `${item.fullColourway || ""} ${item.colourway}`.toLowerCase()
  const colours = []
  for (const word of text.split(/[^a-z]+/)) {
    const colour = COLOUR_WORDS[word]
    if (colour && !colours.includes(colour)) {
      colours.push(colour)
    }
  }
  return colours
}

const descriptionFor = (item) => {
  const modelShort = item.model.replace(/^ASICS /, "")
  const colourText = item.fullColourway || item.colourway
  return [
    `The ${item.model} ${item.colourway} brings ASICS sportstyle heritage into a layered technical runner with a ${colourText.toLowerCase()} colourway.`,
    `Built around ${modelShort}'s recognisable mesh-and-overlay construction, the shoe balances retro running detail with everyday streetwear wearability.`,
    "Metallic and tonal panel work gives the upper depth, while the sculpted midsole and GEL cushioning keep the silhouette unmistakably ASICS.",
    `Style ${item.code} is a strong option for anyone wanting a clean technical sneaker with enough colour detail to stand out without overpowering a rotation.`,
    `Pair the ${modelShort} ${item.colourway} with cargos, relaxed denim, or simple layered basics for an easy sportstyle finish.`,
  ].join("\n\n")
}

const products = await listProducts()
const tags = await listTags()
const tagByValue = new Map(tags.map((tag) => [tag.value, tag]))
const productsByExternalId = new Map(products.map((product) => [product.external_id, product]))

await ensureTag(tagByValue, "asics")
await ensureTag(tagByValue, "asics-gel-kayano-14")
await ensureTag(tagByValue, "asics-gel-nyc")

const report = {
  started_at: new Date().toISOString(),
  dry_run: dryRun,
  updated: [],
  missing: [],
}

for (const [externalId, item] of Object.entries(PRODUCTS)) {
  const product = productsByExternalId.get(externalId)
  if (!product) {
    report.missing.push(externalId)
    continue
  }

  const title = `${item.model} - ${item.colourway}`
  const handleBase = slugify(`${item.model} ${item.colourway}`)
  const handle = item.duplicate ? `${handleBase}-2` : handleBase
  const colours = coloursFor(item)
  const tagValues = [
    "asics",
    item.model === "ASICS Gel-NYC" ? "asics-gel-nyc" : "asics-gel-kayano-14",
    ...colours.map((colour) => `colour:${colour}`),
  ]
  const nextTags = []
  for (const value of tagValues) {
    nextTags.push(await ensureTag(tagByValue, value))
  }

  const payload = {
    title,
    handle,
    description: descriptionFor(item),
    tags: nextTags.map((tag) => ({ id: tag.id })),
    metadata: {
      ...(product.metadata || {}),
      researched_product_name: title,
      corrected_product_code: item.code,
      model: item.model,
      colourway: item.colourway,
      full_colourway: item.fullColourway || item.colourway,
      colour_tags: colours.map((colour) => `colour:${colour}`).join(" | "),
      colour_confidence: item.confidence,
      colour_source: item.source,
      correction_note: item.note || "",
    },
  }

  if (!dryRun) {
    await adminFetch(`/admin/products/${product.id}?fields=id,title,handle,external_id,*tags,metadata`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
  }

  report.updated.push({
    id: product.id,
    external_id: externalId,
    old_title: product.title,
    new_title: title,
    handle,
    tags: tagValues,
  })
  console.log(`${dryRun ? "Would update" : "Updated"} ${externalId}: ${title} [${tagValues.join(", ")}]`)
}

report.finished_at = new Date().toISOString()
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Report: ${REPORT_PATH}`)
