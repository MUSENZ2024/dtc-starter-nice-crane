import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pretty, render } from "@react-email/render"
import React from "react"
import { WelcomeTrustEmail } from "../emails/WelcomeTrustEmailTemplate"

const preview = {
  previewText: "Tracked delivery, local support, and straightforward returns.",
  firstName: "Ana",
  code: "MUSE20-TRUST",
  expiresAt: "29 Jul 2026, 10:30 am",
  unsubscribeUrl: "https://musenz.com/marketing/unsubscribe?preview=1",
  shopUrl: "https://musenz.com/store?preview=1",
}

async function main() {
  const html = await pretty(await render(<WelcomeTrustEmail {...preview} />))
  const renderedText = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
  const outputPath = resolve(process.cwd(), "welcome-trust-preview.html")
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
    "Secure Checkout",
    "Tracked Delivery",
    "New Zealand Support",
    "Straightforward Returns",
    "NZ$20 off your first qualifying order of NZ$150 or more.",
    "Auckland, New Zealand",
  ]

  for (const marker of htmlMarkers) {
    if (!html.includes(marker)) throw new Error(`Trust preview is missing HTML marker: ${marker}`)
  }
  for (const marker of textMarkers) {
    if (!renderedText.includes(marker)) throw new Error(`Trust preview is missing text marker: ${marker}`)
  }
  if (renderedText.includes("PO Box 1234") || renderedText.includes("SEE WHAT'S MOVING")) {
    throw new Error("Trust preview contains removed placeholder or legacy copy")
  }

  console.log(`Rendered ${outputPath}`)
  console.log(`Verified ${htmlMarkers.length + textMarkers.length} trust-email markers`)
}

void main()
