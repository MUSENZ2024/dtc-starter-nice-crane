import fs from "node:fs/promises"
import path from "node:path"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const REPORT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-898556/medusa-import-report.json"
const OUT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-category-898556/shox-tl-us-sizing-fix-report.json"
const ENV_PATH = path.resolve(".image-upload.env")
const onlyProduct = process.argv.find((arg) => arg.startsWith("--product-id="))?.split("=")[1]
const dryRun = process.argv.includes("--dry-run")

const SIZE_MAP = {
  "36": { eu_size: "36", us_mens_size: "4", us_womens_size: "5.5", uk_size: "3.5", cm_jp_size: "23", display_size: "M 4 / W 5.5" },
  "37": { eu_size: "37", us_mens_size: "5", us_womens_size: "6.5", uk_size: "4.5", cm_jp_size: "23.5", display_size: "M 5 / W 6.5", notes: "Supplier EU 37 displayed using Nike US 5 / W 6.5 slot." },
  "38": { eu_size: "38", us_mens_size: "5.5", us_womens_size: "7", uk_size: "5", cm_jp_size: "24", display_size: "M 5.5 / W 7" },
  "39": { eu_size: "39", us_mens_size: "6.5", us_womens_size: "8", uk_size: "6", cm_jp_size: "24.5", display_size: "M 6.5 / W 8" },
  "40": { eu_size: "40", us_mens_size: "7", us_womens_size: "8.5", uk_size: "6", cm_jp_size: "25", display_size: "M 7 / W 8.5" },
  "41": { eu_size: "41", us_mens_size: "8", us_womens_size: "9.5", uk_size: "7", cm_jp_size: "26", display_size: "M 8 / W 9.5" },
  "42": { eu_size: "42", us_mens_size: "8.5", us_womens_size: "10", uk_size: "7.5", cm_jp_size: "26.5", display_size: "M 8.5 / W 10" },
  "43": { eu_size: "43", us_mens_size: "9.5", us_womens_size: "11", uk_size: "8.5", cm_jp_size: "27.5", display_size: "M 9.5 / W 11" },
  "44": { eu_size: "44", us_mens_size: "10", us_womens_size: "11.5", uk_size: "9", cm_jp_size: "28", display_size: "M 10 / W 11.5" },
  "45": { eu_size: "45", us_mens_size: "11", us_womens_size: "12.5", uk_size: "10", cm_jp_size: "29", display_size: "M 11 / W 12.5" },
}

const KEEP_EU_SIZES = Object.keys(SIZE_MAP)
const DISPLAY_VALUES = KEEP_EU_SIZES.map((size) => SIZE_MAP[size].display_size)

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`)
  return body
}

const getOptionValue = (variant) => variant.options?.find((option) => option.option?.title === "Size" || option.option_title === "Size")?.value || variant.title

const productIds = JSON.parse(await fs.readFile(REPORT_PATH, "utf8"))
  .created
  .map((product) => product.product_id)
  .filter((id) => !onlyProduct || id === onlyProduct)

const report = { started_at: new Date().toISOString(), dry_run: dryRun, fixed: [], failed: [] }

for (const productId of productIds) {
  try {
    const { product } = await adminFetch(`/admin/products/${productId}?fields=id,title,handle,metadata,options.*,variants.*,variants.options.*`)
    const sizeOption = product.options?.find((option) => option.title === "Size")
    if (!sizeOption) throw new Error(`Product has no Size option: ${productId}`)

    const variantsByEu = new Map()
    const variantsToDelete = []

    for (const variant of product.variants || []) {
      const euSize = variant.metadata?.eu_size || getOptionValue(variant)
      if (SIZE_MAP[euSize] && !variantsByEu.has(euSize)) {
        variantsByEu.set(euSize, variant)
      } else {
        variantsToDelete.push({ ...variant, eu_size: euSize })
      }
    }

    for (const euSize of KEEP_EU_SIZES) {
      if (!variantsByEu.has(euSize)) throw new Error(`${product.handle} missing source EU size ${euSize}`)
    }

    if (!dryRun) {
      await adminFetch(`/admin/products/${product.id}/options/${sizeOption.id}?fields=id,title,options.*,variants.*,variants.options.*`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values: [...new Set([...DISPLAY_VALUES, ...[...variantsByEu.keys()]])] }),
      })

      for (const euSize of KEEP_EU_SIZES) {
        const variant = variantsByEu.get(euSize)
        const size = SIZE_MAP[euSize]
        await adminFetch(`/admin/products/${product.id}/variants/${variant.id}?fields=id,title,options.*,metadata`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: size.display_size,
            options: { Size: size.display_size },
            metadata: {
              ...(variant.metadata || {}),
              ...size,
              size_system: "nike-jordan-us",
              source_size_system: "eu",
            },
          }),
        })
      }

      for (const variant of variantsToDelete) {
        await adminFetch(`/admin/products/${product.id}/variants/${variant.id}`, { method: "DELETE" })
      }

      await adminFetch(`/admin/products/${product.id}/options/${sizeOption.id}?fields=id,title,options.*,variants.*,variants.options.*`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values: DISPLAY_VALUES }),
      })

      await adminFetch(`/admin/products/${product.id}?fields=id,metadata`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...(product.metadata || {}),
            source_size_system: "eu",
            display_size_system: "nike-jordan-us",
            size_display_note: "Sizes are shown as US Men's / US Women's.",
          },
        }),
      })
    }

    report.fixed.push({
      product_id: product.id,
      handle: product.handle,
      title: product.title,
      kept: KEEP_EU_SIZES.map((euSize) => ({
        eu_size: euSize,
        variant_id: variantsByEu.get(euSize).id,
        display_size: SIZE_MAP[euSize].display_size,
      })),
      deleted: variantsToDelete.map((variant) => ({
        variant_id: variant.id,
        title: variant.title,
        eu_size: variant.eu_size,
      })),
    })
    console.log(`${dryRun ? "Would fix" : "Fixed"} ${product.handle}: kept ${KEEP_EU_SIZES.length}, deleted ${variantsToDelete.length}`)
  } catch (error) {
    report.failed.push({ product_id: productId, error: error.message })
    console.error(`Failed ${productId}: ${error.message}`)
    if (onlyProduct) throw error
  }
  await fs.writeFile(OUT_PATH, JSON.stringify(report, null, 2))
}

report.finished_at = new Date().toISOString()
await fs.writeFile(OUT_PATH, JSON.stringify(report, null, 2))
console.log(`Wrote ${OUT_PATH}`)
