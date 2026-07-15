import fs from "node:fs/promises"
import path from "node:path"

const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-735665"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const IMPORT_PATH = path.join(BASE_DIR, "gel-kayano-14-ko-medusa-import-no-images.csv")
const REVIEW_PATH = path.join(BASE_DIR, "gel-kayano-14-ko-enriched-review.csv")

const SIZES = [
  "36",
  "37",
  "37.5",
  "38",
  "39",
  "39.5",
  "40",
  "40.5",
  "41.5",
  "42",
  "42.5",
  "43.5",
  "44",
  "44.5",
  "45",
  "46",
  "46.5",
  "47",
]

const PRICE = "160.00"

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  brandTag: "ptag_01KT3WBGRY1SAJZC635R9S9S4E",
  lineTag: "ptag_01KT3WHJYJR1ECDCBASYR1QP6J",
}

const COLOUR_TAGS = {
  black: "ptag_01KTK0SR51P97PKDFT8C71GB7C",
  white: "ptag_01KTK0SS4R8Q5GND0N1GYJ9M22",
  yellow: "ptag_01KTK0ST22THTSY2GEKR65PC6H",
  blue: "ptag_01KTK0SV150KKT12JSR2QZMKCD",
  red: "ptag_01KTK0SW25N1NG5KEDVZ9RJ22N",
  green: "ptag_01KTK0SX2DKV8ZQGFB1FVKM1PP",
  grey: "ptag_01KTK0SY4FX25YG2EGSCF492ZT",
  silver: "ptag_01KTK0SZ2015C5CVST8ME9TG9K",
  gold: "ptag_01KTK0T04Q64DJVCXJW8NB33H5",
  cream: "ptag_01KTK0T16H0P37V5JFZQHFTH3W",
  beige: "ptag_01KTK0T26069JENXQ0DCZ911CN",
  brown: "ptag_01KTK0T39BAKFZMGCAB2TWM79E",
  purple: "ptag_01KTK0T55T6BAQ7VXYTHXRKE9S",
  pink: "ptag_01KTK0T683H8S8P8N57HWZ15QH",
  orange: "ptag_01KTK0T77BSMSK6HKE2K6ET055",
  olive: "ptag_01KTK0T87C7GGA7E0K667BMZCQ",
}

const TITLE_COLOURS = [
  [/灰色/, ["grey"]],
  [/银绿/, ["silver", "green"]],
  [/紫色/, ["purple"]],
]

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const colourLabel = (colours) =>
  colours
    .map((colour) => colour.charAt(0).toUpperCase() + colour.slice(1))
    .join(" ")

const coloursFromTitle = (title) => {
  for (const [pattern, colours] of TITLE_COLOURS) {
    if (pattern.test(title)) {
      return colours
    }
  }

  return []
}

const descriptionFor = (code, colours) => {
  const colourText = colourLabel(colours)
  const colourPhrase = colourText ? ` in a ${colourText.toLowerCase()} colour mix` : ""

  return [
    `The ASICS Gel-Kayano 14 Style ${code} brings the model's technical runner shape into an everyday sneaker rotation${colourPhrase}.`,
    "Layered mesh and synthetic overlays give the upper the structured early-2000s look the Gel-Kayano line is known for.",
    "The sculpted midsole, segmented sole profile, and panelled details create a balanced mix of retro performance styling and modern streetwear wearability.",
    "A cushioned underfoot feel and padded collar make it easy to wear through the day while keeping the distinctive Gel-Kayano 14 silhouette.",
    `Pair the Gel-Kayano 14 Style ${code} with cargos, relaxed denim, or clean technical layers for a sharp sportstyle finish.`,
  ].join("\n\n")
}

const header = [
  "Product Id",
  "Product Handle",
  "Product Title",
  "Product Subtitle",
  "Product Description",
  "Product Status",
  "Product Thumbnail",
  "Product Weight",
  "Product Length",
  "Product Width",
  "Product Height",
  "Product HS Code",
  "Product Origin Country",
  "Product MID Code",
  "Product Material",
  "Shipping Profile Id",
  "Product Sales Channel 1",
  "Product Collection Id",
  "Product Category 1",
  "Product Type Id",
  "Product Tag 1",
  "Product Tag 2",
  "Product Tag 3",
  "Product Tag 4",
  "Product Tag 5",
  "Product Discountable",
  "Product External Id",
  "Variant Id",
  "Variant Title",
  "Variant SKU",
  "Variant Barcode",
  "Variant Allow Backorder",
  "Variant Manage Inventory",
  "Variant Weight",
  "Variant Length",
  "Variant Width",
  "Variant Height",
  "Variant HS Code",
  "Variant Origin Country",
  "Variant MID Code",
  "Variant Material",
  "Variant Price EUR",
  "Variant Price NZD",
  "Variant Price USD",
  "Variant Option 1 Name",
  "Variant Option 1 Value",
  "Variant Option 2 Name",
  "Variant Option 2 Value",
  "Product Image 1 Url",
  "Product Image 2 Url",
]

const raw = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
const codeCounts = new Map()
for (const album of raw) {
  codeCounts.set(album.product_code, (codeCounts.get(album.product_code) || 0) + 1)
}

const seenCodes = new Map()
const importRows = [header]
const reviewRows = [
  [
    "product_code",
    "product_external_id",
    "product_name",
    "seo_title",
    "meta_description",
    "url_slug",
    "model",
    "colourway",
    "primary_colour",
    "secondary_colour",
    "colour_tags",
    "colour_source",
    "colour_confidence",
    "product_details",
    "source_url",
    "source_title",
    "local_folder",
    "local_image_count",
    "notes",
  ],
]

for (const album of raw) {
  const code = album.product_code
  const duplicateIndex = (seenCodes.get(code) || 0) + 1
  seenCodes.set(code, duplicateIndex)

  const duplicateSuffix = codeCounts.get(code) > 1 ? `-${duplicateIndex}` : ""
  const externalId = `YUP735665-${code}${duplicateSuffix}`.toUpperCase()
  const title = `ASICS Gel-Kayano 14 - Style ${code}${duplicateSuffix ? ` ${duplicateIndex}` : ""}`
  const handle = slugify(`asics-gel-kayano-14-style-${code}${duplicateSuffix}`)
  const colours = coloursFromTitle(album.source_title)
  const tagIds = colours.map((colour) => COLOUR_TAGS[colour]).filter(Boolean)
  const description = descriptionFor(code, colours)
  const seoColour = colourLabel(colours) || "Technical Runner"
  const confidence = colours.length ? "partial" : "needs review"
  const colourSource = colours.length ? "Yupoo title text" : "not verified"

  for (const size of SIZES) {
    importRows.push([
      "",
      handle,
      title,
      "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
      description,
      "published",
      "",
      "400",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      IDS.shippingProfile,
      IDS.salesChannel,
      IDS.collection,
      IDS.category,
      IDS.productType,
      IDS.brandTag,
      IDS.lineTag,
      tagIds[0] || "",
      tagIds[1] || "",
      tagIds[2] || "",
      "TRUE",
      externalId,
      "",
      size,
      `MUSE-GK14-KO-${externalId}-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
      "",
      "TRUE",
      "FALSE",
      "400",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      PRICE,
      PRICE,
      PRICE,
      "Size",
      size,
      "",
      "",
      "",
      "",
    ])
  }

  reviewRows.push([
    code,
    externalId,
    title,
    `${title.replace(" - ", " ")} | ${seoColour} Sneakers | MUSE NZ`,
    `Shop ${title.replace(" - ", " ")}, a layered ASICS Gel-Kayano 14 with retro technical runner styling and everyday comfort. Available now at MUSE NZ.`,
    handle,
    "ASICS Gel-Kayano 14",
    "",
    colours[0] || "",
    colours[1] || "",
    colours.map((colour) => `colour:${colour}`).join(" | "),
    colourSource,
    confidence,
    description.replaceAll("\n\n", " | "),
    album.source_url,
    album.source_title,
    album.local_folder,
    album.local_images?.length || 0,
    confidence === "needs review" ? "Colourway not verified; title uses style code." : "Colour inferred from Yupoo title; verify before using as official colourway.",
  ])
}

await fs.writeFile(IMPORT_PATH, importRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))

console.log(IMPORT_PATH)
console.log(REVIEW_PATH)
