import chart from "./puma-sizing.json"

type Product = {
  title?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
  tags?: { value?: string | null }[] | null
}

export const isPumaFootwear = (product: Product) => {
  const brand = String(product.metadata?.brand ?? "").toLowerCase()
  const tags = product.tags?.map((tag) => tag.value?.toLowerCase()) ?? []
  const identity = `${product.title ?? ""} ${product.handle ?? ""}`
  const puma = brand === "puma" || tags.includes("puma") || /\bpuma\b/i.test(identity)
  return puma && (
    product.metadata?.sizing_profile === "puma-footwear-v1" ||
    product.metadata?.product_kind === "footwear" ||
    /speedcat|sneaker|shoe|suede|palermo|mostro|h-street/i.test(identity)
  )
}

export const pumaSizeNote = chart.note
export const pumaFit = chart.fit
export const pumaFitCopy = "1% size down, 91% true to size, 8% size up."
export const pumaSizeRows = chart.rows.map((row) => [
  row.men, row.women ?? "—", row.eu, row.cm, row.uk_men, row.uk_women ?? "—",
])

// Bare values are interpreted only when the importer declares their system.
// Paired labels pass through unchanged, preserving the actual variant key.
export const getPumaSizeLabel = (value: string, product: Product) => {
  if (/^M\s+\d/i.test(value)) return value
  const explicitEu = /^EU\s*/i.test(value)
  const system = explicitEu ? "eu" : product.metadata?.display_size_system
  const number = value.replace(/^EU\s*/i, "").trim()
  const row = system === "eu"
    ? chart.rows.find((entry) => entry.eu === number)
    : system === "us-men"
      ? chart.rows.find((entry) => entry.men === number)
      : undefined
  return row ? `M ${row.men}${row.women ? ` / W ${row.women}` : ""}` : value
}
