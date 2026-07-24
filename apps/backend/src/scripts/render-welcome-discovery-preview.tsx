import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pretty, render } from "@react-email/render"
import React from "react"
import { WelcomeDiscoveryEmail } from "../emails/WelcomeDiscoveryEmailTemplate"

const preview = {
  previewText: "Outerwear, footwear and everyday favourites from MUSE.",
  firstName: "Ana",
  code: "MUSE20-DISCOVERY",
  expiresAt: "31 August 2026",
  unsubscribeUrl: "https://store.musenz.com/marketing/unsubscribe?preview=1",
  shopUrl: "https://store.musenz.com/store?preview=1",
}

async function main() {
  const html = await pretty(await render(<WelcomeDiscoveryEmail {...preview} />))
  const renderedText = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
  const outputPath = resolve(process.cwd(), "welcome-discovery-preview.html")
  await writeFile(outputPath, html, "utf8")

  const productHandles = [
    "nuptse-jacket-black",
    "birkenstock-boston-soft-footbed-suede-taupe-nz-stock",
    "nuptse-vest-black",
    "asics-gel-kayano-14-white-graphite-grey",
  ]
  const squareImages = [
    "nuptse-jacket-black-square.jpg",
    "birkenstock-boston-taupe-square.jpg",
    "nuptse-vest-black-square.jpg",
    "asics-gel-kayano-14-square.jpg",
  ]
  const htmlMarkers = [
    preview.code,
    preview.shopUrl,
    "https://store.musenz.com/faq",
    "https://store.musenz.com/track",
    "mailto:support@musenz.com",
    preview.unsubscribeUrl,
    "social-instagram-transparent.png",
    "social-facebook-transparent.png",
    "inter-latin.woff2",
    "raleway-latin.woff2",
    "font-family: 'Inter'",
    "font-family: 'Raleway'",
    'width="240"',
    'height="240"',
    ...productHandles,
    ...squareImages,
  ]
  const textMarkers = [
    `Expires ${preview.expiresAt}`,
    "Four Pieces Worth Knowing About",
    "Outerwear, footwear and everyday favourites from MUSE.",
    "Stock, sizes and availability are confirmed on each product page.",
    "NZ$20 off your first qualifying order of NZ$150 or more.",
    "Find something you like.",
    "Auckland, New Zealand",
  ]

  for (const marker of htmlMarkers) {
    if (!html.includes(marker)) throw new Error(`Discovery preview is missing HTML marker: ${marker}`)
  }
  for (const marker of textMarkers) {
    if (!renderedText.toLowerCase().includes(marker.toLowerCase())) {
      throw new Error(`Discovery preview is missing text marker: ${marker}`)
    }
  }

  const forbidden = ["preference you chose", "selected interest", "your muse edit", "explore your edit", "PO Box 1234"]
  for (const marker of forbidden) {
    if (renderedText.toLowerCase().includes(marker.toLowerCase())) {
      throw new Error(`Discovery preview contains removed copy: ${marker}`)
    }
  }

  console.log(`Rendered ${outputPath}`)
  console.log(`Verified ${htmlMarkers.length + textMarkers.length + forbidden.length} discovery-email checks`)
}

void main()
