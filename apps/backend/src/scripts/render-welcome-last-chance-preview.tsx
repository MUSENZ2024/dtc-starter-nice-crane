import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pretty, render } from "@react-email/render"
import React from "react"
import { WelcomeLastChanceEmail } from "../emails/WelcomeLastChanceEmailTemplate"

const preview = {
  previewText: "Your NZ$20 welcome offer ends tonight.",
  firstName: "Ana",
  code: "MUSE20-FINAL",
  expiresAt: "31 August 2026, 11:59 pm",
  unsubscribeUrl: "https://musenz.com/marketing/unsubscribe?preview=1",
  shopUrl: "https://musenz.com/store?preview=1",
}

async function main() {
  const html = await pretty(await render(<WelcomeLastChanceEmail {...preview} />))
  const renderedText = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
  const outputPath = resolve(process.cwd(), "welcome-last-chance-preview.html")
  await writeFile(outputPath, html, "utf8")

  const htmlMarkers = [
    preview.code,
    preview.shopUrl,
    "https://musenz.com/faq",
    "https://musenz.com/track",
    "mailto:support@musenz.com",
    preview.unsubscribeUrl,
    "social-instagram-transparent.png",
    "social-facebook-transparent.png",
    "inter-latin.woff2",
    "raleway-latin.woff2",
    "font-family: 'Inter'",
    "font-family: 'Raleway'",
  ]
  const textMarkers = [
    `Expires ${preview.expiresAt}`,
    "Your NZ$20 Welcome Offer Ends Tonight",
    "A quick reminder—your NZ$20 welcome offer ends tonight.",
    "NZ$20 off your first qualifying order of NZ$150 or more.",
    "Single use. First qualifying order only.",
    "Use My Code",
    "Auckland, New Zealand",
  ]
  const forbidden = [
    "before the real expiry time below",
    "fake countdown",
    "rolling countdown",
    "selected interest",
    "preference",
    "PO Box",
    "postal address",
  ]

  for (const marker of htmlMarkers) {
    if (!html.includes(marker)) throw new Error(`Final reminder is missing HTML marker: ${marker}`)
  }
  for (const marker of textMarkers) {
    if (!renderedText.toLowerCase().includes(marker.toLowerCase())) {
      throw new Error(`Final reminder is missing text marker: ${marker}`)
    }
  }
  for (const marker of forbidden) {
    if (renderedText.toLowerCase().includes(marker.toLowerCase())) {
      throw new Error(`Final reminder contains removed copy: ${marker}`)
    }
  }

  console.log(`Rendered ${outputPath}`)
  console.log(`Verified ${htmlMarkers.length + textMarkers.length + forbidden.length} final-reminder checks`)
}

void main()
