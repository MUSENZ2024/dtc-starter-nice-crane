import fs from "node:fs/promises"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = new URL("../.image-upload.env", import.meta.url)

const CATEGORY_IDS = {
  footwear: "pcat_01KT3H7DAPDPCCP22N9WXMKTH1",
  boots: "pcat_01KT3HTPTCWGZ4G8Y5WTGP42C5",
  sandals: "pcat_01KT3HVWSHGSW3S0CW47QYQS4E",
  loafers: "pcat_01KT3HWP8WDMQ8MXYW6BRN0X96",
}

const CORRECTIONS = [
  { handle: "dr-martens-1460-smooth-leather-boots-cherry-red", modelTag: "model:dr-martens-1460", model: "1460", category: CATEGORY_IDS.boots },
  { handle: "dr-martens-myles-leather-buckle-slide-sandals-black", modelTag: "model:dr-martens-myles", model: "Myles", category: CATEGORY_IDS.sandals },
  { handle: "dr-martens-blaire-hydro-leather-strap-sandals-black", modelTag: "model:dr-martens-blaire-hydro", model: "Blaire Hydro", category: CATEGORY_IDS.sandals },
  { handle: "dr-martens-jadon-smooth-leather-platform-boots-black", modelTag: "model:dr-martens-jadon", model: "Jadon", category: CATEGORY_IDS.boots },
  { handle: "dr-martens-1461-smooth-leather-platform-shoes-black", modelTag: "model:dr-martens-1461", model: "1461", category: CATEGORY_IDS.footwear },
  { handle: "dr-martens-adrian-smooth-leather-tassel-loafers-black", modelTag: "model:dr-martens-adrian", model: "Adrian", category: CATEGORY_IDS.loafers },
  { handle: "dr-martens-8065-smooth-leather-mary-jane-shoes-black", modelTag: "model:dr-martens-8065-mary-jane", model: "8065 Mary Jane", category: CATEGORY_IDS.footwear },
]

const env = await fs.readFile(ENV_PATH, "utf8")
const apiKey = env.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH.pathname}`)
const authHeaders = { Authorization: `Basic ${apiKey}` }

const fetchJson = async (path, options = {}) => {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(`${BACKEND_URL}${path}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } })
    const text = await response.text()
    let body
    try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
    if (response.ok) return body
    const retryable = response.status >= 500
    if (!retryable || attempt === 4) throw new Error(`${options.method || "GET"} ${path} failed ${response.status}: ${JSON.stringify(body).slice(0, 900)}`)
    await new Promise((resolve) => setTimeout(resolve, attempt * 2500))
  }
}

const allTags = []
for (let offset = 0; ; offset += 100) {
  const body = await fetchJson(`/admin/product-tags?limit=100&offset=${offset}`)
  const page = body.product_tags || body.tags || []
  allTags.push(...page)
  if (page.length < 100) break
}
const tagsByValue = new Map(allTags.map((tag) => [tag.value, tag]))
const ensureTag = async (value) => {
  if (tagsByValue.has(value)) return tagsByValue.get(value)
  const body = await fetchJson("/admin/product-tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value }),
  })
  const tag = body.product_tag || body.tag
  tagsByValue.set(value, tag)
  return tag
}

for (const correction of CORRECTIONS) {
  const found = await fetchJson(`/admin/products?handle=${correction.handle}&fields=id,title,*tags,+metadata`)
  const product = found.products?.[0]
  if (!product) throw new Error(`Product not found: ${correction.handle}`)

  const colourTags = (product.tags || []).filter((tag) => /^colou?r[:/]/i.test(tag.value))
  const brand = await ensureTag("brand:dr-martens")
  const model = await ensureTag(correction.modelTag)
  const body = await fetchJson(`/admin/products/${product.id}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      tags: [brand, model, ...colourTags].map((tag) => ({ id: tag.id })),
      categories: [{ id: correction.category }],
      metadata: { ...product.metadata, model: correction.model },
    }),
  })
  console.log(`Updated: ${body.product?.title} → ${correction.model}`)
}
