import fs from "node:fs/promises"

const sourcePath = new URL("./import-dr-martens-myles-sandals-black-undersized-nz-stock-clearance.mjs", import.meta.url)
let source = await fs.readFile(sourcePath, "utf8")

const replacements = new Map([
  ["dr-martens-myles-sandals-black-undersized-nz-stock-clearance-report.json", "dr-martens-blaire-hydro-sandals-black-undersized-nz-stock-clearance-report.json"],
  ["/Users/mrburns_mac/Downloads/IMG_8584.jpeg", "/Users/mrburns_mac/Downloads/IMG_7723.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8585.jpeg", "/Users/mrburns_mac/Downloads/IMG_7722.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8586.jpeg", "/Users/mrburns_mac/Downloads/IMG_7724.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8588.jpeg", "/Users/mrburns_mac/Downloads/IMG_7725.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8589.jpeg", "/Users/mrburns_mac/Downloads/IMG_7726.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8590.jpeg", "/Users/mrburns_mac/Downloads/IMG_7727.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8592.jpeg", "/Users/mrburns_mac/Downloads/IMG_7728.jpeg"],
  ["/Users/mrburns_mac/Downloads/IMG_8587.jpeg", "/Users/mrburns_mac/Downloads/IMG_7729.jpeg"],
  ["ptag_01KVMXXMM07PPNSRZ9S7V5HANB", "ptag_01KVMXXQAM8734FK26TWD85W32"],
  ["model:dr-martens-myles", "model:dr-martens-blaire-hydro"],
  ["prod_01KVMWM4BVVZDXGK3SB16SSJFK", "prod_01KVMWMNH458VYVKF9CH71W0GZ"],
  ["dr-martens-myles-sandals-black-undersized-nz-stock-clearance", "dr-martens-blaire-hydro-sandals-black-undersized-nz-stock-clearance"],
  ["NZSTOCK-CLEARANCE-DRMARTENS-MYLES-BLACK-UNDERSIZED", "NZSTOCK-CLEARANCE-DRMARTENS-BLAIRE-HYDRO-BLACK-UNDERSIZED"],
  ["MUSE-NZ-DRMARTENS-MYLES-BLACK-UNDERSIZED-CLR-", "MUSE-NZ-DRMARTENS-BLAIRE-HYDRO-BLACK-UNDERSIZED-CLR-"],
  ["Myles Sandals - Black feature a two-strap slide silhouette with adjustable branded buckles, black uppers, signature yellow welt stitching and a lightweight ripple sole.", "Blaire Hydro Sandals - Black feature a black Hydro leather multi-strap upper with an adjustable ankle buckle, SoftWair footbed, signature yellow welt stitching and a lightweight platform sole."],
  ["stock held in sizes 38 (3), 40 (1), and 41 (2)", "stock held in sizes 38 (1) and 40 (2)"],
  ["\"38\": 3,\n  \"40\": 1,\n  \"41\": 2,", "\"38\": 1,\n  \"40\": 2,"],
  ["model: \"Myles\"", "model: \"Blaire Hydro\""],
  ["upper_material: \"Leather\"", "upper_material: \"Hydro Leather\""],
  ["material: \"Leather\"", "material: \"Hydro Leather\""],
  ["Existing Dr. Martens Myles product was preserved.", "Existing Dr. Martens Blaire Hydro product was preserved."],
  ["Dr. Martens Myles Sandals - Black | Clearance NZ Stock | MUSE", "Dr. Martens Blaire Hydro Sandals - Black | Clearance NZ Stock | MUSE"],
  ["Clearance Dr. Martens Myles Sandals in Black. NZ Stock EU sizes 38, 40 and 41, $80 final sale.", "Clearance Dr. Martens Blaire Hydro Sandals in Black. NZ Stock EU sizes 38 and 40, $80 final sale."],
  ["Dr. Martens Myles Sandals - Black", "Dr. Martens Blaire Hydro Sandals - Black"],
])

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`Importer template drift: missing ${from}`)
  source = source.split(from).join(to)
}

await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)
