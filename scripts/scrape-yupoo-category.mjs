import fs from "node:fs/promises"
import path from "node:path"
import { chromium } from "/Users/mrburns_mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs"

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split("=")
      return [key, value.join("=") || "true"]
    })
)

const CATEGORY_URL = args.url
const SLUG = args.slug || "yupoo-category-scrape"
const EXPECTED = args.expected ? Number(args.expected) : null
const MAX_ALBUMS = args.max ? Number(args.max) : null
const OUT_DIR = path.resolve("..", "medusa-imports", SLUG)
const IMAGE_DIR = path.join(OUT_DIR, "images")
const RAW_PATH = path.join(OUT_DIR, "raw-albums.json")
const REVIEW_PATH = path.join(OUT_DIR, "scrape-review.csv")

if (!CATEGORY_URL) {
  throw new Error("Missing required --url=https://... argument")
}

const csvEscape = (value) => {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const extractCode = (title) => {
  const matches = [
    ...String(title || "").matchAll(/\b([A-Z0-9]{4,12}(?:[-.][A-Z0-9]{2,6})?|\d{3,6}[A-Z]{1,3}\d{0,5}(?:[-.][A-Z0-9]{2,6})?)\b/g),
  ]
    .map((match) => match[1].replace(".", "-"))
    .filter((code) => !/^\d+Y$/.test(code))
    .filter((code) => !/^\d{2,3}$/.test(code))
    .filter((code) => !/^SIZE$/i.test(code))

  return matches.at(-1) || ""
}

const toBestImageUrl = (src) => {
  if (!src) {
    return ""
  }

  return src.replace(/\/(?:small|medium)\.jpg(?:\?.*)?$/, "/big.jpg")
}

const collectAlbumLinks = async (page) => {
  await page.goto(CATEGORY_URL, { waitUntil: "domcontentloaded", timeout: 60000 })
  await page.waitForSelector('a[href*="/albums/"]', { timeout: 30000 })
  await page.waitForTimeout(1500)

  return page.evaluate((maxAlbums) => {
    const seen = new Set()
    const links = [...document.querySelectorAll('a[href*="/albums/"]')]
      .map((link) => link.href)
      .filter((href) => {
        if (seen.has(href)) {
          return false
        }

        seen.add(href)
        return true
      })

    return maxAlbums ? links.slice(0, maxAlbums) : links
  }, MAX_ALBUMS)
}

const scrapeAlbum = async (page, url, index) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })
  await page.waitForTimeout(1800)

  return page.evaluate(
    ({ url, index }) => {
      const title =
        document.querySelector(".showalbumheader__gallerytitle")?.textContent?.trim() ||
        document.querySelector("h1")?.textContent?.trim() ||
        document.querySelector("h2")?.textContent?.trim() ||
        document.title

      const images = [...document.images]
        .map((img) => ({
          src: img.src,
          alt: img.alt || "",
          width: img.naturalWidth,
          height: img.naturalHeight,
        }))
        .filter((img) => img.src.includes("photo.yupoo.com"))

      const deduped = []
      const seen = new Set()
      for (const image of images) {
        const key = image.src.replace(/\/(?:small|medium|big)\.jpg(?:\?.*)?$/, "")
        if (seen.has(key)) {
          continue
        }

        seen.add(key)
        deduped.push(image)
      }

      return {
        source_url: url,
        source_title: title,
        index,
        images: deduped,
      }
    },
    { url, index }
  )
}

const downloadImage = async (request, url, filePath) => {
  const attempts = [url.replace("/big.jpg", "/medium.jpg"), url.replace("/big.jpg", "/small.jpg"), url]

  for (const attempt of attempts) {
    try {
      const response = await request.get(attempt, {
        timeout: 10000,
        headers: {
          referer: CATEGORY_URL,
        },
      })

      if (!response.ok) {
        continue
      }

      const bytes = await response.body()
      if (bytes.length < 1000) {
        continue
      }

      await fs.writeFile(filePath, bytes)
      return attempt
    } catch {
      // Try next image size.
    }
  }

  return ""
}

const buildReviewCsv = (albums) => {
  const rows = [
    [
      "index",
      "product_code",
      "source_title",
      "suggested_handle",
      "image_count",
      "downloaded_image_count",
      "album_url",
      "local_folder",
      "first_image_url",
      "needs_review",
    ],
  ]

  for (const album of albums) {
    rows.push([
      album.index + 1,
      album.product_code,
      album.source_title,
      album.suggested_handle,
      album.images.length,
      album.local_images.length,
      album.source_url,
      album.local_folder,
      album.image_urls[0] || "",
      album.product_code ? "" : "missing product code",
    ])
  }

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n")
}

const main = async () => {
  await fs.mkdir(IMAGE_DIR, { recursive: true })

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

  const albumLinks = await collectAlbumLinks(page)
  if (EXPECTED != null && albumLinks.length !== EXPECTED) {
    console.warn(`Expected ${EXPECTED} album links, found ${albumLinks.length}. Continuing.`)
  }

  const rawAlbums = []
  for (let index = 0; index < albumLinks.length; index += 1) {
    const raw = await scrapeAlbum(page, albumLinks[index], index)
    rawAlbums.push(raw)
    console.log(`Scraped ${index + 1}/${albumLinks.length}: ${raw.source_title}`)
  }

  const albums = []
  for (const rawAlbum of rawAlbums) {
    const productCode = extractCode(rawAlbum.source_title)
    const suggestedHandle = slugify(productCode ? `${SLUG}-${productCode}` : `${SLUG}-${rawAlbum.index + 1}`)
    const localFolder = path.join(IMAGE_DIR, suggestedHandle)
    await fs.mkdir(localFolder, { recursive: true })

    const imageUrls = rawAlbum.images.slice(0, 8).map((image) => toBestImageUrl(image.src))
    const localImages = []
    const downloadedImageUrls = []

    for (let index = 0; index < imageUrls.length; index += 1) {
      const filePath = path.join(localFolder, `${String(index + 1).padStart(2, "0")}.jpg`)
      const usedUrl = await downloadImage(page.request, imageUrls[index], filePath)
      if (usedUrl) {
        downloadedImageUrls.push(usedUrl)
        localImages.push(filePath)
      }
    }

    albums.push({
      ...rawAlbum,
      product_code: productCode,
      suggested_handle: suggestedHandle,
      image_urls: downloadedImageUrls,
      local_images: localImages,
      local_folder: localFolder,
    })
  }

  await browser.close()

  await fs.writeFile(RAW_PATH, JSON.stringify(albums, null, 2))
  await fs.writeFile(REVIEW_PATH, buildReviewCsv(albums))

  console.log(`Wrote ${RAW_PATH}`)
  console.log(`Wrote ${REVIEW_PATH}`)
  console.log(`Downloaded images to ${IMAGE_DIR}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
