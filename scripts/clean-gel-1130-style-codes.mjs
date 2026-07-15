import fs from "node:fs/promises"

const BACKEND_URL = "https://appealing-quince-change.medusajs.app"
const ENV_PATH = ".image-upload.env"
const STYLE_CODE_RE = /\b(?:IQ\d{4}-\d{3}|\d{4}[A-Z]\d{3}-\d{3})\b/g
const TARGET_PREFIXES = ["YUP608475-", "YUP603157-"]

const envText = await fs.readFile(ENV_PATH, "utf8")
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]
if (!apiKey?.startsWith("sk_")) throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`)

const authHeaders = { Authorization: `Basic ${apiKey}` }
const dryRun = process.argv.includes("--dry-run")

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
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`)
  return body
}

const listProducts = async () => {
  const products = []
  for (let offset = 0; offset < 5000; offset += 100) {
    const body = await adminFetch(`/admin/products?limit=100&offset=${offset}&fields=id,title,handle,external_id,description,metadata`)
    products.push(...(body.products || []))
    if ((body.products || []).length < 100) break
  }
  return products
}

const cleanSpaces = (value) => value.replace(/\s+/g, " ").trim()

const stripTrailingCodeFromTitle = (title) => {
  const prefix = "ASICS GEL-1130 - "
  if (!title.startsWith(prefix)) return title

  const name = title.slice(prefix.length)
  const matches = [...name.matchAll(STYLE_CODE_RE)]
  const last = matches.at(-1)
  if (!last) return title

  const code = last[0]
  const before = cleanSpaces(name.slice(0, last.index))
  const after = cleanSpaces(name.slice((last.index || 0) + code.length))
  if (!before || after) return title
  if (before === code) return title

  return `${prefix}${before}`
}

const stripCodeFromOpeningSentence = (description, oldTitle, newTitle) => {
  if (!description || oldTitle === newTitle) return description

  const oldName = oldTitle.replace(/^ASICS GEL-1130 - /, "")
  const newName = newTitle.replace(/^ASICS GEL-1130 - /, "")
  const oldOpening = `The ASICS GEL-1130 ${oldName} brings`
  const newOpening = `The ASICS GEL-1130 ${newName} brings`
  if (description.startsWith(oldOpening)) {
    return newOpening + description.slice(oldOpening.length)
  }

  const firstBreak = description.indexOf("\n\n")
  const firstParagraph = firstBreak === -1 ? description : description.slice(0, firstBreak)
  const cleanedFirst = firstParagraph.replace(STYLE_CODE_RE, "").replace(/\s+/g, " ").trim()
  if (cleanedFirst !== firstParagraph) {
    return firstBreak === -1 ? cleanedFirst : `${cleanedFirst}${description.slice(firstBreak)}`
  }

  return description
}

const products = await listProducts()
const targets = products.filter((product) =>
  TARGET_PREFIXES.some((prefix) => product.external_id?.startsWith(prefix)) &&
  product.title?.startsWith("ASICS GEL-1130 - ")
)

const changed = []
for (const product of targets) {
  const title = stripTrailingCodeFromTitle(product.title)
  const description = stripCodeFromOpeningSentence(product.description || "", product.title, title)
  const metadata = { ...(product.metadata || {}) }
  if (metadata.colourway && title !== product.title) {
    metadata.colourway = title.replace(/^ASICS GEL-1130 - /, "")
  }

  if (title === product.title && description === (product.description || "") && JSON.stringify(metadata) === JSON.stringify(product.metadata || {})) {
    continue
  }

  changed.push({ id: product.id, external_id: product.external_id, old_title: product.title, new_title: title })
  if (!dryRun) {
    await adminFetch(`/admin/products/${product.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description, metadata }),
    })
  }
  console.log(`${dryRun ? "Would update" : "Updated"} ${product.external_id}: ${product.title} -> ${title}`)
}

console.log(JSON.stringify({ dry_run: dryRun, matched: targets.length, changed: changed.length }, null, 2))
