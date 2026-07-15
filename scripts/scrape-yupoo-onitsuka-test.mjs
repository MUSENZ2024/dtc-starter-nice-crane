import fs from "node:fs/promises"
import path from "node:path"
import { chromium } from "/Users/mrburns_mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs"

const CATEGORY_URL = "https://yolo66.x.yupoo.com/categories/798907?isSubCate=true"
const OUT_DIR = path.resolve("..", "medusa-imports", "yupoo-onitsuka-test")
const IMAGE_DIR = path.join(OUT_DIR, "images")
const CSV_PATH = path.join(OUT_DIR, "onitsuka-mexico-66-medusa-import.csv")
const REVIEW_PATH = path.join(OUT_DIR, "onitsuka-mexico-66-review.csv")
const RAW_PATH = path.join(OUT_DIR, "raw-albums.json")

const SIZES = [
  "36",
  "36.5",
  "37",
  "38",
  "38.5",
  "39",
  "40",
  "40.5",
  "41.5",
  "42",
  "42.5",
  "43.5",
  "44",
  "44.5",
  "45",
]

const PRODUCT_DESCRIPTION = `The Onitsuka Tiger Mexico 66 combines vintage Japanese running heritage with a slim, low-profile silhouette that has become a timeless everyday sneaker.

Originally inspired by classic training shoes from the 1960s, the Mexico 66 features a lightweight shape, signature stripe detailing, and a flexible sole made for easy daily wear.

The clean retro profile works across casual, streetwear, and collector styling, making it one of the most recognisable vintage-inspired sneakers in the Onitsuka Tiger lineup.

Designed for all-day comfort, the shoe features a cushioned footbed, flexible sole, and lightweight construction that makes it ideal for everyday wear.

Whether you're building a classic sneaker rotation or want a slim heritage silhouette with strong colourway appeal, the Mexico 66 remains a timeless addition to any collection.`

const KILL_BILL_DESCRIPTION = `The Onitsuka Tiger Mexico 66 Kill Bill combines vintage Japanese running heritage with a bold yellow and black colourway that has become instantly recognisable worldwide.

Originally inspired by classic training shoes from the 1960s, the Mexico 66 features a lightweight low-profile silhouette, premium leather construction, and signature Onitsuka Tiger stripe detailing throughout.

The striking yellow upper paired with contrasting black accents creates a standout look that works equally well as a statement sneaker or a collector's piece.

Designed for all-day comfort, the shoe features a cushioned footbed, flexible sole, and lightweight construction that makes it ideal for everyday wear.

Whether you're a fan of classic sneakers, Japanese streetwear, or simply one of the most famous movie-inspired colourways ever made, the Mexico 66 Kill Bill remains a timeless addition to any collection.`

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
  const codeMatches = [
    ...title.matchAll(/\b(?:[A-Z]{1,4}\d{2,5}|\d{2,5}[A-Z][A-Z0-9]*)(?:-[A-Z0-9]{2,5})?\b/g),
  ]
    .map((match) => match[0])
    .filter((code) => !/^\d+Y$/.test(code))

  return codeMatches.at(-1) || ""
}

const getColourwayName = (code, index) => {
  const known = {
    "DL408-0490": "Kill Bill",
  }

  return known[code] || `Style ${code || String(index + 1).padStart(2, "0")}`
}

const getProductName = (code, index) => {
  const colourway = getColourwayName(code, index)
  return colourway === "Kill Bill"
    ? "Onitsuka Tiger Mexico 66 Kill Bill"
    : `Onitsuka Tiger Mexico 66 ${colourway}`
}

const getSeoTitle = (name, code) =>
  name.includes("Kill Bill")
    ? "Onitsuka Tiger Mexico 66 Kill Bill | Yellow Black Sneakers | MUSE NZ"
    : `${name} | Onitsuka Tiger Sneakers | MUSE NZ`

const getMetaDescription = (name, code) =>
  name.includes("Kill Bill")
    ? "Shop Onitsuka Tiger Mexico 66 Kill Bill featuring the iconic yellow and black colourway, slim profile, and timeless vintage-inspired design. Available now at MUSE NZ."
    : `Shop ${name}, a slim vintage-inspired Onitsuka Tiger Mexico 66 sneaker with signature stripe detailing and everyday comfort. Style code ${code}. Available now at MUSE NZ.`

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

  return page.evaluate(() => {
    const seen = new Set()

    return [...document.querySelectorAll('a[href*="/albums/"]')]
      .map((link) => link.href)
      .filter((href) => {
        if (seen.has(href)) {
          return false
        }

        seen.add(href)
        return true
      })
      .slice(0, 25)
  })
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
      // try the next image size
    }
  }

  return url
}

const buildCsv = (albums) => {
  const header = [
    "Product Id",
    "Product Handle",
    "Product Title",
    "Product Subtitle",
    "Product Description",
    "Product Status",
    "Product Thumbnail",
    "Product Weight",
    "Product Length",
    "Product Width",
    "Product Height",
    "Product HS Code",
    "Product Origin Country",
    "Product MID Code",
    "Product Material",
    "Shipping Profile Id",
    "Product Sales Channel 1",
    "Product Collection Id",
    "Product Type Id",
    "Product Tag 1",
    "Product Tag 2",
    "Product Tag 3",
    "Product Discountable",
    "Product External Id",
    "Variant Id",
    "Variant Title",
    "Variant SKU",
    "Variant Barcode",
    "Variant Allow Backorder",
    "Variant Manage Inventory",
    "Variant Weight",
    "Variant Length",
    "Variant Width",
    "Variant Height",
    "Variant HS Code",
    "Variant Origin Country",
    "Variant MID Code",
    "Variant Material",
    "Variant Price EUR",
    "Variant Price USD",
    "Variant Price NZD",
    "Variant Option 1 Name",
    "Variant Option 1 Value",
    "Product Image 1 Url",
    "Product Image 2 Url",
    "Product Image 3 Url",
    "Product Image 4 Url",
    "Product Image 5 Url",
    "Product Image 6 Url",
    "Product Image 7 Url",
    "Product Image 8 Url",
  ]

  const rows = [header]

  for (const album of albums) {
    const description =
      album.product_name === "Onitsuka Tiger Mexico 66 Kill Bill"
        ? KILL_BILL_DESCRIPTION
        : PRODUCT_DESCRIPTION

    for (const size of SIZES) {
      rows.push([
        "",
        album.handle,
        album.product_name,
        "Standard Delivery - Ships in 13-16 days - tracked end-to-end",
        description,
        "published",
        album.image_urls[0] || "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Sneakers",
        "Asics",
        "Onitsuka Tiger Mexico 66",
        "TRUE",
        album.product_code,
        "",
        size,
        `${album.product_code}-${size}`.replace(/\s+/g, ""),
        "",
        "FALSE",
        "TRUE",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "160",
        "Size",
        size,
        ...album.image_urls.slice(0, 8),
      ])
    }
  }

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n")
}

const buildReviewCsv = (albums) => {
  const rows = [
    [
      "Product Name",
      "Product Code",
      "Handle",
      "SEO Title",
      "Meta Description",
      "Category",
      "Brand Tag",
      "Line Tag",
      "Delivery",
      "Price NZD",
      "Sizes",
      "Image Count",
      "Album URL",
      "Local Image Folder",
      "Source Title",
    ],
  ]

  for (const album of albums) {
    rows.push([
      album.product_name,
      album.product_code,
      album.handle,
      album.seo_title,
      album.meta_description,
      "Sneakers",
      "Asics",
      "Onitsuka Tiger Mexico 66",
      "Standard delivery",
      "160",
      SIZES.join(" | "),
      album.local_images.length,
      album.source_url,
      album.local_folder,
      album.source_title,
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
  if (albumLinks.length < 25) {
    throw new Error(`Expected 25 album links, found ${albumLinks.length}.`)
  }
  const rawAlbums = []

  for (let index = 0; index < albumLinks.length; index += 1) {
    const raw = await scrapeAlbum(page, albumLinks[index], index)
    rawAlbums.push(raw)
    console.log(`Scraped ${index + 1}/${albumLinks.length}: ${raw.source_title}`)
  }

  const albums = []
  for (const rawAlbum of rawAlbums) {
    const productCode = extractCode(rawAlbum.source_title) || `MEXICO66-${rawAlbum.index + 1}`
    const productName = getProductName(productCode, rawAlbum.index)
    const handle = slugify(`asics-${productName}`)
    const localFolder = path.join(IMAGE_DIR, handle)
    await fs.mkdir(localFolder, { recursive: true })

    const imageUrls = rawAlbum.images.slice(0, 8).map((image) => toBestImageUrl(image.src))
    const localImages = []
    const downloadedImageUrls = []

    for (let index = 0; index < imageUrls.length; index += 1) {
      const filePath = path.join(localFolder, `${String(index + 1).padStart(2, "0")}.jpg`)
      const usedUrl = await downloadImage(page.request, imageUrls[index], filePath)
      downloadedImageUrls.push(usedUrl)
      localImages.push(filePath)
    }

    albums.push({
      ...rawAlbum,
      product_code: productCode,
      product_name: productName,
      handle,
      seo_title: getSeoTitle(productName, productCode),
      meta_description: getMetaDescription(productName, productCode),
      image_urls: downloadedImageUrls,
      local_images: localImages,
      local_folder: localFolder,
    })
  }

  await browser.close()

  await fs.writeFile(RAW_PATH, JSON.stringify(albums, null, 2))
  await fs.writeFile(CSV_PATH, buildCsv(albums))
  await fs.writeFile(REVIEW_PATH, buildReviewCsv(albums))

  console.log(`Wrote ${CSV_PATH}`)
  console.log(`Wrote ${REVIEW_PATH}`)
  console.log(`Downloaded images to ${IMAGE_DIR}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
