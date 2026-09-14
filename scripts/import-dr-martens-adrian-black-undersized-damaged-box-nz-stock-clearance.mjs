import fs from "node:fs/promises"

const sourcePath = new URL("./import-dr-martens-myles-sandals-black-undersized-nz-stock-clearance.mjs", import.meta.url)
let source = await fs.readFile(sourcePath, "utf8")

const replacements = new Map([
  ["dr-martens-myles-sandals-black-undersized-nz-stock-clearance-report.json", "dr-martens-adrian-black-undersized-damaged-box-nz-stock-clearance-report.json"],
  ["/Users/mrburns_mac/Downloads/IMG_8584.jpeg", "/Users/mrburns_mac/Downloads/IMG_5429.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8585.jpeg", "/Users/mrburns_mac/Downloads/IMG_5436.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8586.jpeg", "/Users/mrburns_mac/Downloads/IMG_5430.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8588.jpeg", "/Users/mrburns_mac/Downloads/IMG_5431.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8589.jpeg", "/Users/mrburns_mac/Downloads/IMG_5432.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8590.jpeg", "/Users/mrburns_mac/Downloads/IMG_5433.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8592.jpeg", "/Users/mrburns_mac/Downloads/IMG_5434.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8587.jpeg", "/Users/mrburns_mac/Downloads/IMG_5435.jpeg"],
  ["pcat_01KT3HVWSHGSW3S0CW47QYQS4E", "pcat_01KT3HWP8WDMQ8MXYW6BRN0X96"],
  ["Sandals & Clogs", "Loafers"],
  ["ptag_01KVMXXMM07PPNSRZ9S7V5HANB", "ptag_01KVMXXY6SAZWVNFX5BFCXWZ91"],
  ["model:dr-martens-myles", "model:dr-martens-adrian"],
  ["prod_01KVMWM4BVVZDXGK3SB16SSJFK", "prod_01KVMWP386MWQH2YXVTTW5AKSE"],
  ["Myles Sandals - Black feature a two-strap slide silhouette with adjustable branded buckles, black uppers, signature yellow welt stitching and a lightweight ripple sole.", "Adrian Smooth Leather Tassel Loafers - Black feature a polished Smooth leather upper, classic tassel and kiltie detailing, signature yellow welt stitching and the grooved air-cushioned sole."],
  ["stock held in sizes 38 (3), 40 (1), and 41 (2)", "stock held in size 41 (1)"],
  ["\"38\": 3,\n  \"40\": 1,\n  \"41\": 2,", "\"41\": 1,"],
  ["Clearance - Runs About 2 Sizes Small - Final Sale, No Refunds", "Clearance - Runs About 1 Size Small - Damaged Box - Final Sale, No Refunds"],
  ["approximately two EU sizes smaller", "approximately one EU size smaller"],
  ["approximately two EU sizes small", "approximately one EU size small"],
  ["undersized_by_approximately_2_eu_sizes", "undersized_by_approximately_1_eu_size"],
  ["MUSE-NZ-DRMARTENS-MYLES-BLACK-UNDERSIZED-CLR-", "MUSE-NZ-DRMARTENS-ADRIAN-BLACK-UNDERSIZED-DMGBOX-CLR-"],
  ["model: \"Myles\"", "model: \"Adrian\""],
  ["upper_material: \"Leather\"", "upper_material: \"Smooth Leather\""],
  ["material: \"Leather\"", "material: \"Smooth Leather\""],
  ["Existing Dr. Martens Myles product was preserved.", "Existing Dr. Martens Adrian product was preserved."],
  ["exchange_policy_note: \"No refunds or exchanges - final sale\",", "exchange_policy_note: \"No refunds or exchanges - final sale\",\n    condition_note: \"Damaged box\",\n    packaging_condition: \"damaged_box\","],
  ["Dr. Martens Myles Sandals - Black | Clearance NZ Stock | MUSE", "Dr. Martens Adrian Smooth Leather Tassel Loafers - Black | Clearance NZ Stock | MUSE"],
  ["Clearance Dr. Martens Myles Sandals in Black. NZ Stock EU sizes 38, 40 and 41, $80 final sale.", "Clearance Dr. Martens Adrian Smooth Leather Tassel Loafers in Black. NZ Stock EU41, $80 final sale with damaged box."],
  ["Dr. Martens Myles Sandals - Black", "Dr. Martens Adrian Smooth Leather Tassel Loafers - Black"],
  ["dr-martens-myles-sandals-black-undersized-nz-stock-clearance", "dr-martens-adrian-black-undersized-damaged-box-nz-stock-clearance"],
  ["NZSTOCK-CLEARANCE-DRMARTENS-MYLES-BLACK-UNDERSIZED", "NZSTOCK-CLEARANCE-DRMARTENS-ADRIAN-BLACK-UNDERSIZED-DAMAGED-BOX"],
  ["This pair is NZ Stock and priced as Clearance. This is final sale clearance stock - no refunds or exchanges.", "This pair is NZ Stock and priced as Clearance. The box is damaged. This is final sale clearance stock - no refunds or exchanges."],
])

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`Importer template drift: missing ${from}`)
  source = source.split(from).join(to)
}

await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)
