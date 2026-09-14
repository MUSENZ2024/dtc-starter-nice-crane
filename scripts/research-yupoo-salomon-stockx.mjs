import fs from "node:fs/promises"
import path from "node:path"

const RAW_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-salomon-xt6-406490/raw-albums.json"
const OUT_PATH = "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/yupoo-salomon-xt6-406490/stockx-search-results.json"
const MODEL = "Salomon XT-6"

const albums = JSON.parse(await fs.readFile(RAW_PATH, "utf8"))
const codes = [...new Set(albums.map((a) => a.product_code))]

const decodeHtml = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&#x27;", "'")
  .replaceAll("&quot;", '"')
  .replaceAll("&#x2F;", "/")

const findStockxResult = (markdown, code) => {
  const productMatch = markdown.match(/### \[([\s\S]{0,800}?)\]\((https:\/\/stockx\.com\/[^)#]+)/i)
  if (!productMatch) return null
  const afterProduct = markdown.slice(productMatch.index, productMatch.index + 2400)
  const colorwayMatch = afterProduct.match(/Colorway\.\s*([^;\n]+)/i)
  const styleMatch = afterProduct.match(/Style\.\s*([^;\n]+)/i)
  return {
    code,
    stockx_url: productMatch[2],
    stockx_title: decodeHtml(productMatch[1].split(/\s+!\[Image/)[0].replace(/\s+\.\.\.$/, "").trim()),
    stockx_colourway: colorwayMatch ? decodeHtml(colorwayMatch[1].trim()) : null,
    stockx_style: styleMatch ? decodeHtml(styleMatch[1].trim()) : null,
  }
}

const existing = await fs.readFile(OUT_PATH, "utf8").then(JSON.parse).catch(() => ({ results: [] }))
const resultsByCode = new Map(existing.results.map((result) => [result.code, result]))
const pendingCodes = codes.filter((code) => !resultsByCode.get(code)?.stockx_colourway)

const researchCode = async (code) => {
  const searchUrl = `http://www.google.com/search?q=${encodeURIComponent(`${MODEL} ${code} StockX`)}`
  const url = `https://r.jina.ai/${searchUrl}`
  try {
    const response = await fetch(url)
    const markdown = await response.text()
    const result = findStockxResult(markdown, code)
    return { code, search_url: searchUrl, status: response.status, ...result }
  } catch (error) {
    return { code, search_url: searchUrl, error: error.message }
  }
}

for (let start = 0; start < pendingCodes.length; start += 4) {
  const batch = pendingCodes.slice(start, start + 4)
  const researched = await Promise.all(batch.map(researchCode))
  for (const result of researched) {
    resultsByCode.set(result.code, result)
    console.log(`${start + batch.indexOf(result.code) + 1}/${pendingCodes.length} ${result.code}: ${result.stockx_title || "no StockX result"}`)
  }
  await fs.writeFile(OUT_PATH, JSON.stringify({ generated_at: new Date().toISOString(), results: codes.map((code) => resultsByCode.get(code)) }, null, 2))
  await new Promise((resolve) => setTimeout(resolve, 500))
}

const results = codes.map((code) => resultsByCode.get(code))
await fs.mkdir(path.dirname(OUT_PATH), { recursive: true })
await fs.writeFile(OUT_PATH, JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2))
console.log(`Wrote ${OUT_PATH}`)
