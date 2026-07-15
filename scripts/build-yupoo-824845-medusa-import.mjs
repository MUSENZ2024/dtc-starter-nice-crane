import fs from "node:fs/promises"
import path from "node:path"

const BASE_DIR = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-824845"
const RAW_PATH = path.join(BASE_DIR, "raw-albums.json")
const IMPORT_PATH = path.join(BASE_DIR, "mexico-66-sz-medusa-import-no-images.csv")
const REVIEW_PATH = path.join(BASE_DIR, "mexico-66-sz-enriched-review.csv")

const SIZES = ["36", "36.5", "37", "38", "38.5", "39", "40", "40.5", "41.5", "42", "42.5", "43.5", "44", "44.5", "45"]

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J51S16Z3ZJ86V8G9ZQRYY",
  productType: "ptyp_01KT3XJ279QP3ZS5PC3RJJ04H1",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  brandTag: "ptag_01KT3WBGRY1SAJZC635R9S9S4E",
  lineTag: "ptag_01KT3WHSJ1C065C3GZ58K0RGJ0",
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

const ENRICHMENT = {
  "1183A201-254": { name: "Oatmeal Ginger Peach", colourway: "Oatmeal Ginger Peach", colours: ["cream", "beige", "orange"], confidence: "verified", source: "StockX / marketplace results" },
  "1183B771-114": { name: "Beige Olive Brown", colourway: "Beige Olive Brown", colours: ["beige", "olive", "brown"], confidence: "verified", source: "Solesense / marketplace results" },
  "1183B781-104": { name: "White Dusty Pink", colourway: "White Dusty Pink", colours: ["white", "pink"], confidence: "verified", source: "GOAT / Sneakerjagers / marketplace results" },
  "1183B781-103": { name: "Cream Sage", colourway: "Cream Sage", colours: ["cream", "green"], confidence: "verified", source: "Stadium Goods marketplace result" },
  "1183B771-115": { name: "1183B771-115", colourway: "", colours: [], confidence: "needs review", source: "not verified" },
  "D508K-0190": { name: "White Black", colourway: "White Black", colours: ["white", "black"], confidence: "verified", source: "Solesense / Sneakerjagers" },
  "1183A201-305": { name: "Garden Green Pure Silver", colourway: "Garden Green Pure Silver", colours: ["green", "silver", "blue"], confidence: "verified", source: "Novelship / marketplace results" },
  "1183B771-702": { name: "1183B771-702", colourway: "", colours: [], confidence: "needs review", source: "not verified" },
  "1183C102-500": { name: "1183C102-500", colourway: "", colours: ["purple"], confidence: "needs review", source: "not verified" },
  "1183C076-103": { name: "1183C076-103", colourway: "", colours: [], confidence: "needs review", source: "not verified" },
  "1183A201-120": { name: "Cream Mineral Brown", colourway: "Cream Mineral Brown", colours: ["cream", "brown"], confidence: "verified", source: "GOAT / Novelship / marketplace results" },
  "1183B391-204": { name: "Mineral Brown Cream", colourway: "Mineral Brown Cream", colours: ["brown", "cream"], confidence: "verified", source: "Onitsuka Tiger / marketplace results" },
  "1183C102-004": { name: "Black Classic Red", colourway: "Black Classic Red", colours: ["black", "red"], confidence: "verified", source: "GOAT / Onitsuka Tiger" },
  "1183A771-111": { name: "Cream Green", colourway: "Cream Green", colours: ["cream", "green"], confidence: "partial", source: "matched to nearby code 1183B771-111; review required" },
  "1183C076-020": { name: "1183C076-020", colourway: "", colours: ["grey"], confidence: "needs review", source: "not verified" },
  "1183B039-115": { name: "1183B039-115", colourway: "", colours: [], confidence: "needs review", source: "not verified" },
  "DL408-0101": { name: "White Beige", colourway: "White Beige", colours: ["white", "beige", "grey"], confidence: "verified", source: "Solesense / marketplace results" },
  "1183A201-114": { name: "1183A201-114", colourway: "", colours: [], confidence: "needs review", source: "not verified" },
  "1183A201-003": { name: "Black Yellow", colourway: "Black Yellow", colours: ["black", "yellow"], confidence: "partial", source: "marketplace result" },
  "D5V2L-9094": { name: "Black Gold Silver", colourway: "Black Gold Silver", colours: ["black", "gold", "silver"], confidence: "verified", source: "StockX / Onitsuka Tiger / GOAT" },
  "1183B771-700": { name: "1183B771-700", colourway: "", colours: ["yellow"], confidence: "needs review", source: "not verified" },
  "1183C519-101": { name: "1183C519-101", colourway: "", colours: [], confidence: "needs review", source: "not verified" },
  "1183B771-116": { name: "1183B771-116", colourway: "", colours: [], confidence: "needs review", source: "not verified" },
  "1182A104-100": { name: "1182A104-100", colourway: "", colours: ["white"], confidence: "needs review", source: "not verified" },
  "1183C076-256": { name: "1183C076-256", colourway: "", colours: ["beige"], confidence: "needs review", source: "not verified" },
  "1183B771-251": { name: "1183B771-251", colourway: "", colours: ["beige"], confidence: "needs review", source: "not verified" },
  "1183C076-253": { name: "1183C076-253", colourway: "", colours: ["beige"], confidence: "needs review", source: "not verified" },
  "1183B771-703": { name: "1183B771-703", colourway: "", colours: ["yellow"], confidence: "needs review", source: "not verified" },
  "1183C076-252": { name: "1183C076-252", colourway: "", colours: ["beige"], confidence: "needs review", source: "not verified" },
  "1183C102-002": { name: "1183C102-002", colourway: "", colours: ["black"], confidence: "needs review", source: "not verified" },
}

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

const descriptionFor = (name, colours) => {
  const colourText = colourLabel(colours) || "heritage"
  return [
    `The Onitsuka Tiger Mexico 66 ${name} brings the model's slim 1960s running profile into a distinctive ${colourText.toLowerCase()} colourway.`,
    "The low-profile upper keeps the shoe light and easy to style, while the signature Onitsuka Tiger side stripes give it the heritage look the Mexico 66 is known for.",
    `This ${name} edition is built around colour contrast rather than bulk, making it a clean everyday sneaker with enough character to stand out in a rotation.`,
    "A cushioned footbed, flexible sole, and lightweight construction make it comfortable for daily wear without losing the vintage shape.",
    `Pair the Mexico 66 ${name} with relaxed denim, cargos, or simple streetwear pieces for an easy retro-inspired finish.`,
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
const importRows = [header]
const reviewRows = [[
  "product_code",
  "product_name",
  "seo_title",
  "meta_description",
  "url_slug",
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
]]

for (const album of raw) {
  const code = album.product_code
  const info = ENRICHMENT[code] || { name: code, colourway: "", colours: [], confidence: "needs review", source: "not verified" }
  const title = `Onitsuka Tiger Mexico 66 - ${info.name}`
  const handle = slugify(`asics-${title}`)
  const colours = info.colours || []
  const tagIds = colours.map((colour) => COLOUR_TAGS[colour]).filter(Boolean)
  const description = descriptionFor(info.name, colours)
  const seoColour = colourLabel(colours) || "Heritage"

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
      code,
      "",
      size,
      `MUSE-MEXICO66-SZ-${code}-${size}`.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
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
      "160.00",
      "160.00",
      "160.00",
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
    title,
    `${title.replace(" - ", " ")} | ${seoColour} Sneakers | MUSE NZ`,
    `Shop ${title.replace(" - ", " ")} featuring the ${seoColour.toLowerCase()} colourway, slim profile, and timeless vintage-inspired design. Available now at MUSE NZ.`,
    handle,
    info.colourway || "",
    colours[0] || "",
    colours[1] || "",
    colours.map((colour) => `colour:${colour}`).join(" | "),
    info.source,
    info.confidence,
    description.replaceAll("\n\n", " | "),
    album.source_url,
    album.source_title,
    album.local_folder,
    album.local_images?.length || 0,
    info.confidence === "needs review" ? "Colourway not verified; title uses product code." : "",
  ])
}

await fs.writeFile(IMPORT_PATH, importRows.map((row) => row.map(csvEscape).join(",")).join("\n"))
await fs.writeFile(REVIEW_PATH, reviewRows.map((row) => row.map(csvEscape).join(",")).join("\n"))

console.log(IMPORT_PATH)
console.log(REVIEW_PATH)
