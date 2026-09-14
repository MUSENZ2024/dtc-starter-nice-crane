import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, "..")
const WORKSPACE = path.resolve(ROOT, "..")
const APPLY = process.argv.includes("--apply")
const REPORT_PATH = path.join(WORKSPACE, "medusa-imports", "draft-ugg-products-report.json")
const FOOTWEAR_CATEGORIES = new Set(["boots", "sneakers", "sandals & clogs"])

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=")
        return [line.slice(0, separator), line.slice(separator + 1)]
      })
  )
}

const adminEnv = parseEnv(await fs.readFile(path.join(ROOT, ".image-upload.env"), "utf8"))
const storefrontEnv = parseEnv(await fs.readFile(path.join(ROOT, "apps/storefront/.env.local"), "utf8"))
const backend = storefrontEnv.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "")
const adminKey = adminEnv.MEDUSA_ADMIN_API_KEY
const publishableKey = storefrontEnv.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

if (!backend || !adminKey?.startsWith("sk_") || !publishableKey) {
  throw new Error("Missing Medusa backend URL, Admin API key, or Store API publishable key")
}

const adminHeaders = { Authorization: `Basic ${adminKey}` }

async function requestJson(url, options = {}, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...options.headers },
        signal: AbortSignal.timeout(45_000),
      })
      if (response.ok) return await response.json()

      const body = await response.text()
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500
      if (!retryable || attempt === attempts) {
        throw new Error(`${response.status} ${response.statusText}: ${body}`)
      }
      lastError = new Error(`${response.status} ${response.statusText}: ${body}`)
    } catch (error) {
      lastError = error
      if (attempt === attempts) throw error
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** (attempt - 1)))
  }
  throw lastError
}

async function listProducts() {
  const products = []
  let offset = 0

  for (;;) {
    const url = new URL(`${backend}/admin/products`)
    url.searchParams.set("limit", "100")
    url.searchParams.set("offset", String(offset))
    url.searchParams.set("fields", "id,title,handle,status,metadata,*categories")
    const page = await requestJson(url, { headers: adminHeaders })
    products.push(...page.products)
    offset += page.products.length
    if (!page.products.length || offset >= page.count) break
  }

  return products
}

function isUgg(product) {
  return String(product.metadata?.brand ?? "").trim().toLowerCase() === "ugg"
}

function isFootwear(product) {
  return (product.categories ?? []).some((category) =>
    FOOTWEAR_CATEGORIES.has(String(category.name ?? "").trim().toLowerCase())
  )
}

function summary(product) {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    status: product.status,
    brand: product.metadata?.brand ?? null,
    categories: (product.categories ?? []).map((category) => category.name),
  }
}

const beforeProducts = await listProducts()
const uggProducts = beforeProducts.filter(isUgg)
const targets = uggProducts.filter(isFootwear)
const uncategorizedOrNonFootwear = uggProducts.filter((product) => !isFootwear(product))

if (uncategorizedOrNonFootwear.length) {
  throw new Error(
    `Refusing to continue: ${uncategorizedOrNonFootwear.length} UGG-branded products are not in a recognized footwear category: ${uncategorizedOrNonFootwear
      .map((product) => product.handle)
      .join(", ")}`
  )
}

const report = {
  generated_at: new Date().toISOString(),
  mode: APPLY ? "apply" : "dry-run",
  backend,
  match_rule: "metadata.brand equals UGG and category is Boots, Sneakers, or Sandals & Clogs",
  catalog_total_before: beforeProducts.length,
  ugg_footwear_count: targets.length,
  status_before: Object.fromEntries(
    [...new Set(targets.map((product) => product.status))].map((status) => [
      status,
      targets.filter((product) => product.status === status).length,
    ])
  ),
  targets: targets.map(summary),
  updates: [],
  failures: [],
}

if (APPLY) {
  for (const [index, product] of targets.entries()) {
    if (product.status === "draft") {
      report.updates.push({ id: product.id, handle: product.handle, result: "already-draft" })
      continue
    }

    try {
      const result = await requestJson(`${backend}/admin/products/${product.id}`, {
        method: "POST",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      })
      report.updates.push({
        id: product.id,
        handle: product.handle,
        previous_status: product.status,
        status: result.product?.status,
        result: result.product?.status === "draft" ? "updated" : "unexpected-status",
      })
    } catch (error) {
      report.failures.push({ id: product.id, handle: product.handle, error: String(error) })
    }

    if ((index + 1) % 10 === 0 || index + 1 === targets.length) {
      console.log(`Processed ${index + 1}/${targets.length}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const afterProducts = await listProducts()
  const afterById = new Map(afterProducts.map((product) => [product.id, product]))
  const verified = targets.map((product) => summary(afterById.get(product.id) ?? product))
  const remainingNonDraft = verified.filter((product) => product.status !== "draft")

  report.catalog_total_after = afterProducts.length
  report.admin_verification = {
    checked: verified.length,
    draft: verified.filter((product) => product.status === "draft").length,
    remaining_non_draft: remainingNonDraft,
  }

  const publicChecks = []
  let cursor = 0
  async function publicWorker() {
    for (;;) {
      const current = cursor
      cursor += 1
      if (current >= targets.length) return
      const product = targets[current]
      try {
        const url = new URL(`${backend}/store/products`)
        url.searchParams.set("handle", product.handle)
        url.searchParams.set("limit", "10")
        url.searchParams.set("fields", "id,title,handle,status")
        const result = await requestJson(url, {
          headers: { "x-publishable-api-key": publishableKey },
        })
        publicChecks.push({
          handle: product.handle,
          publicly_returned: (result.products ?? []).some((item) => item.id === product.id),
          returned_count: result.products?.length ?? 0,
        })
      } catch (error) {
        publicChecks.push({ handle: product.handle, error: String(error) })
      }
    }
  }

  await Promise.all(Array.from({ length: 6 }, () => publicWorker()))
  report.store_api_verification = {
    checked: publicChecks.length,
    hidden: publicChecks.filter((check) => check.publicly_returned === false).length,
    publicly_returned: publicChecks.filter((check) => check.publicly_returned === true),
    errors: publicChecks.filter((check) => check.error),
    checks: publicChecks.sort((a, b) => a.handle.localeCompare(b.handle)),
  }
}

await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

console.log(
  JSON.stringify(
    {
      mode: report.mode,
      catalog_total_before: report.catalog_total_before,
      ugg_footwear_count: report.ugg_footwear_count,
      status_before: report.status_before,
      updated: report.updates.filter((update) => update.result === "updated").length,
      already_draft: report.updates.filter((update) => update.result === "already-draft").length,
      failures: report.failures.length,
      admin_verification: report.admin_verification,
      store_api_verification: report.store_api_verification
        ? {
            checked: report.store_api_verification.checked,
            hidden: report.store_api_verification.hidden,
            publicly_returned: report.store_api_verification.publicly_returned.length,
            errors: report.store_api_verification.errors.length,
          }
        : undefined,
      report_path: REPORT_PATH,
    },
    null,
    2
  )
)

if (report.failures.length || report.admin_verification?.remaining_non_draft.length) {
  process.exitCode = 1
}
