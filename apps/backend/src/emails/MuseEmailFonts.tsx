import { Font } from "@react-email/components"
import React from "react"

const EMAIL_FONT_BASE_URL =
  process.env.MUSE_EMAIL_FONT_BASE_URL || "https://musenz.com/email-fonts"

const inter = `${EMAIL_FONT_BASE_URL}/inter-latin.woff2`
const raleway = `${EMAIL_FONT_BASE_URL}/raleway-latin.woff2`

export function MuseEmailFonts() {
  return (
    <>
      <Font
        fontFamily="Inter"
        fallbackFontFamily={["Arial", "Helvetica", "sans-serif"]}
        webFont={{ url: inter, format: "woff2" }}
        fontStyle="normal"
        fontWeight={400}
      />
      <Font
        fontFamily="Inter"
        fallbackFontFamily={["Arial", "Helvetica", "sans-serif"]}
        webFont={{ url: inter, format: "woff2" }}
        fontStyle="normal"
        fontWeight={600}
      />
      <Font
        fontFamily="Raleway"
        fallbackFontFamily={["Arial", "Helvetica", "sans-serif"]}
        webFont={{ url: raleway, format: "woff2" }}
        fontStyle="normal"
        fontWeight={700}
      />
      <Font
        fontFamily="Raleway"
        fallbackFontFamily={["Arial", "Helvetica", "sans-serif"]}
        webFont={{ url: raleway, format: "woff2" }}
        fontStyle="normal"
        fontWeight={800}
      />
      <Font
        fontFamily="Raleway"
        fallbackFontFamily={["Arial", "Helvetica", "sans-serif"]}
        webFont={{ url: raleway, format: "woff2" }}
        fontStyle="normal"
        fontWeight={900}
      />
    </>
  )
}
