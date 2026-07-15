import fs from "node:fs/promises"
import path from "node:path"

const args = Object.fromEntries(process.argv.slice(2).filter((arg) => arg.startsWith("--")).map((arg) => {
  const [key, ...value] = arg.slice(2).split("=")
  return [key, value.join("=") || "true"]
}))
const categoryUrl = args.url
const slug = args.slug || "yupoo-category-scrape"
if (!categoryUrl) throw new Error("Missing required --url=https://... argument")

const outDir = path.resolve("..", "medusa-imports", slug)
const imageDir = path.join(outDir, "images")
const rawPath = path.join(outDir, "raw-albums.json")
const reviewPath = path.join(outDir, "scrape-review.csv")
const headers = { "user-agent": "Mozilla/5.0", referer: categoryUrl }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const slugify = (value) => String(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[\",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
const extractCode = (title) => {
  const matches = [...String(title || "").matchAll(/\b([A-Z0-9]{4,12}(?:[-.][A-Z0-9]{2,6})?|\d{3,6}[A-Z]{1,3}\d{0,5}(?:[-.][A-Z0-9]{2,6})?)\b/g)]
    .map((match) => match[1].replace(".", "-"))
    .filter((code) => !/^\d+Y$/.test(code) && !/^\d{2,3}$/.test(code) && !/^SIZE$/i.test(code))
  return matches.at(-1) || ""
}
const decode = (value) => value.replaceAll("&amp;", "&").replaceAll("&#39;", "'").replaceAll("&quot;", '"')
const concurrentMap = async (items, limit, worker) => {
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}
const request = async (url, init = {}, attempts = 3) => {
  let last
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { ...headers, ...(init.headers || {}) }, signal: AbortSignal.timeout(30000) })
      if (response.ok) return response
      last = new Error(`${response.status} ${url}`)
    } catch (error) { last = error }
    await sleep(500 * (attempt + 1))
  }
  throw last
}

const main = async () => {
  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(imageDir, { recursive: true })
  const categoryHtml = await (await request(categoryUrl)).text()
  const linkPattern = /title="([^"]+)"[\s\S]{0,400}?href="(\/albums\/\d+[^\"]*)"/g
  const albums = []
  const seen = new Set()
  for (const match of categoryHtml.matchAll(linkPattern)) {
    const sourceUrl = new URL(decode(match[2]), categoryUrl).href
    if (seen.has(sourceUrl)) continue
    seen.add(sourceUrl)
    const sourceTitle = decode(match[1])
    const productCode = extractCode(sourceTitle)
    const handle = slugify(productCode ? `${slug}-${productCode}` : `${slug}-${albums.length + 1}`)
    albums.push({ index: albums.length, source_url: sourceUrl, source_title: sourceTitle, product_code: productCode, suggested_handle: handle })
  }
  if (!albums.length) throw new Error("No Yupoo albums found in category response")
  console.log(`Found ${albums.length} albums`)
  await concurrentMap(albums, 6, async (album, index) => {
    try {
      const html = await (await request(album.source_url)).text()
      const imageUrls = []
      const imageSeen = new Set()
      for (const match of html.matchAll(/https?:[^\"'\\s]+photo\.yupoo\.com[^\"'\\s]+\/big\.jpg/g)) {
        const url = match[0]
        const key = url.replace(/\/big\.jpg(?:\?.*)?$/, "")
        if (!imageSeen.has(key)) { imageSeen.add(key); imageUrls.push(url) }
        if (imageUrls.length === 8) break
      }
      const localFolder = path.join(imageDir, album.suggested_handle)
      await fs.mkdir(localFolder, { recursive: true })
      const localImages = []
      const downloadedUrls = []
      await concurrentMap(imageUrls, 4, async (url, imageIndex) => {
        try {
          const response = await request(url)
          const bytes = Buffer.from(await response.arrayBuffer())
          if (bytes.length < 1000) throw new Error("Image was too small")
          const filePath = path.join(localFolder, `${String(imageIndex + 1).padStart(2, "0")}.jpg`)
          await fs.writeFile(filePath, bytes)
          localImages[imageIndex] = filePath
          downloadedUrls[imageIndex] = url
        } catch { /* The review row records the shortfall. */ }
      })
      album.images = imageUrls.map((src) => ({ src }))
      album.image_urls = downloadedUrls.filter(Boolean)
      album.local_images = localImages.filter(Boolean)
      album.local_folder = localFolder
    } catch (error) {
      album.images = []
      album.image_urls = []
      album.local_images = []
      album.local_folder = path.join(imageDir, album.suggested_handle)
      album.scrape_error = error.message
    }
    console.log(`Scraped ${index + 1}/${albums.length}: ${album.source_title}`)
  })
  await fs.writeFile(rawPath, JSON.stringify(albums, null, 2))
  const rows = [["index", "product_code", "source_title", "suggested_handle", "image_count", "downloaded_image_count", "album_url", "local_folder", "first_image_url", "needs_review"]]
  for (const album of albums) rows.push([album.index + 1, album.product_code, album.source_title, album.suggested_handle, album.images.length, album.local_images.length, album.source_url, album.local_folder, album.image_urls[0] || "", album.product_code && album.local_images.length >= 8 ? "" : album.scrape_error || "missing product code or images"])
  await fs.writeFile(reviewPath, rows.map((row) => row.map(csvEscape).join(",")).join("\n"))
  console.log(`Wrote ${rawPath}`)
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
