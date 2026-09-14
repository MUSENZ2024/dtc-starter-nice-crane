import fs from "node:fs/promises"

const sourcePath = new URL("./import-adidas-samba-og-white-halo-blue-nz-stock-clearance.mjs", import.meta.url)
let source = await fs.readFile(sourcePath, "utf8")

const imageBlockStart = source.indexOf("const IMAGE_PATHS = [")
const imageBlockEnd = source.indexOf("\n\nconst IDS =", imageBlockStart)
if (imageBlockStart < 0 || imageBlockEnd < 0) throw new Error("Importer template drift: image block missing")
source = `${source.slice(0, imageBlockStart)}const IMAGE_PATHS = [
  "/Users/mrburns_mac/Downloads/IMG_8508.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8509.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8512.jpeg",
  "/Users/mrburns_mac/Downloads/IMG_8513.jpeg",
]${source.slice(imageBlockEnd)}`

const replacements = new Map([
  ["adidas-samba-og-white-halo-blue-nz-stock-clearance-report.json", "adidas-handball-spezial-bright-red-clear-pink-ie5894-nz-stock-clearance-report.json"],
  ["ptag_01KVFN97A4V0VHK9D61ZAMYVBN", "ptag_01KVFN93GDDTFFP72MX2Q3T1P5"],
  ["ptag_01KTK0SS4R8Q5GND0N1GYJ9M22", "ptag_01KTK0SW25N1NG5KEDVZ9RJ22N"],
  ["ptag_01KTK0SV150KKT12JSR2QZMKCD", "ptag_01KTK0T683H8S8P8N57HWZ15QH"],
  ["The adidas Samba OG White Halo Blue updates the classic low-profile Samba with a clean Core White leather upper, pale Halo Blue serrated 3-Stripes and heel tab, and a dark Gum 5 rubber outsole.", "The adidas Handball Spezial Bright Red Clear Pink (Women's) pairs a Bright Red suede upper with Clear Pink suede 3-Stripes, heel detailing and laces, finished over a classic Gum rubber sole."],
  ["The signature T-toe suede overlay adds texture and reinforcement, while the lace closure and streamlined profile retain the football-inspired Samba OG shape.", "Its low-profile shape draws on the archival handball silhouette, with serrated 3-Stripes, gold Spezial branding, a lace closure and patterned rubber traction underfoot."],
  ["This pair is NZ Stock in the physically labelled US 4 / UK 3.5 / EU 36 size, displayed as M 4 / W 5.5 using the MUSE adidas size chart. It is priced as Clearance and is final sale - no refunds or exchanges.", "This pair is NZ Stock in EU40, displayed as M 7 / W 8.5 using the MUSE adidas size chart. The box is damaged. It is priced as Clearance and is final sale - no refunds or exchanges."],
  ["adidas Samba OG - White Halo Blue", "adidas Handball Spezial - Bright Red Clear Pink (Women's)"],
  ["adidas-samba-og-white-halo-blue-id2055-nz-stock-clearance", "adidas-handball-spezial-bright-red-clear-pink-ie5894-nz-stock-clearance"],
  ["NZSTOCK-CLEARANCE-ADIDAS-SAMBA-OG-ID2055-WHITE-HALO-BLUE", "NZSTOCK-CLEARANCE-ADIDAS-HANDBALL-SPEZIAL-IE5894-BRIGHT-RED-CLEAR-PINK"],
  ["ID2055", "IE5894"],
  ["const PRICE = 90", "const PRICE = 80"],
  ["const STOCK_EU_SIZE = \"36\"", "const STOCK_EU_SIZE = \"40\""],
  ["only M 4 / W 5.5 (physical label US 4 / EU 36) has stock 1", "only M 7 / W 8.5 (EU 40) has stock 1"],
  ["Clearance - NZ Stock - US 4 / EU 36 - Final Sale", "Clearance - NZ Stock - EU 40 - Damaged Box - Final Sale"],
  ["MUSE-ADIDAS-SAMBA-", "MUSE-ADIDAS-HANDBALL-SPEZIAL-"],
  ["model: \"Samba OG\"", "model: \"Handball Spezial\""],
  ["model: \"adidas Samba OG\"", "model: \"adidas Handball Spezial\""],
  ["colourway: \"Core White/Halo Blue/Gum 5\"", "colourway: \"Bright Red/Clear Pink/Gum\""],
  ["full_colourway: \"Core White / Halo Blue / Gum 5\"", "full_colourway: \"Bright Red / Clear Pink / Gum\""],
  ["colour_tags: \"colour:white | colour:blue | colour:gum\"", "colour_tags: \"colour:red | colour:pink | colour:gum\""],
  ["colour_source: \"StockX and adidas; product code visible on customer-supplied tongue label\"", "colour_source: \"StockX and customer-provided product photography\""],
  ["https://stockx.com/adidas-samba-og-white-halo-blue", "https://stockx.com/adidas-handball-spezial-bright-red-clear-pink-womens"],
  ["physical_size_label: \"US 4 / UK 3.5 / EU 36 / JP 220 / CHN 220\", requested_size_note: \"User described pair as Women's US 5; physical label is US 4 / EU 36, which maps to M 4 / W 5.5 in the established MUSE adidas chart.\"", "physical_size_label: \"EU 40\", requested_size_note: \"User-specified EU40 stock, displayed as M 7 / W 8.5 in the established MUSE adidas chart.\""],
  ["image_source: \"customer-supplied Marketplace photos\", is_clearance: \"true\", return_policy: \"final_sale_no_refunds\",", "image_source: \"customer-provided product photography\", is_clearance: \"true\", return_policy: \"final_sale_no_refunds\", condition_note: \"Damaged box\", packaging_condition: \"damaged_box\","],
  ["adidas Samba OG White Halo Blue IE5894 | Clearance NZ Stock | MUSE", "adidas Handball Spezial Bright Red Clear Pink IE5894 | Clearance NZ Stock | MUSE"],
  ["Clearance adidas Samba OG White Halo Blue IE5894 in NZ Stock, labelled US 4 / EU 36. Core White, Halo Blue and dark gum sole. $90 final sale.", "Clearance adidas Handball Spezial Bright Red Clear Pink IE5894 in NZ Stock, EU40. Women's colourway with gum sole. $80 damaged-box final sale."],
  ["verified.images.length !== 9", "verified.images.length !== 4"],
  ["stockedVariant?.title !== \"M 4 / W 5.5\"", "stockedVariant?.title !== \"M 7 / W 8.5\""],
])

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`Importer template drift: missing ${from}`)
  source = source.split(from).join(to)
}

await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)
