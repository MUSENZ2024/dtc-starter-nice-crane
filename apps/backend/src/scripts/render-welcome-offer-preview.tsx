import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pretty, render } from "@react-email/render"
import React from "react"
import { WelcomeOfferDeliveryEmail } from "../emails/WelcomeOfferDeliveryTemplate"

const preview = {
  previewText: "Your first-order welcome code is ready.",
  firstName: "Aroha",
  code: "MUSE20-PREVIEW",
  expiresAt: "29 Jul 2026, 10:30 am",
  unsubscribeUrl: "https://store.musenz.com/marketing/unsubscribe?preview=1",
  shopUrl: "https://store.musenz.com/store?preview=1",
}

const requiredHtmlMarkers = [
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
]

async function main() {
  const html = await pretty(await render(<WelcomeOfferDeliveryEmail {...preview} />))
  const renderedText = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
  const outputPath = resolve(process.cwd(), "welcome-offer-preview.html")
  await writeFile(outputPath, html, "utf8")

  for (const expected of requiredHtmlMarkers) {
    if (!html.includes(expected)) {
      throw new Error(`Welcome preview is missing expected content: ${expected}`)
    }
  }

  for (const expected of [`Expires ${preview.expiresAt}`, "Auckland, New Zealand", "Find something you like"]) {
    if (!renderedText.includes(expected)) {
      throw new Error(`Welcome preview is missing expected text: ${expected}`)
    }
  }

  if (renderedText.includes("Physical postal address") || renderedText.includes("Shop your edit")) {
    throw new Error("Welcome preview contains removed footer or step copy")
  }

  console.log(`Rendered ${outputPath}`)
  console.log(`Verified ${requiredHtmlMarkers.length + 3} dynamic content, link, footer, copy, and asset markers`)
}

void main()
