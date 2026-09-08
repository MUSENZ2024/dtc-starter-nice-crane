import { Font } from "@react-email/components"
import React from "react"

const EMAIL_FONT_BASE_URL =
  process.env.MUSE_EMAIL_FONT_BASE_URL || "https://musenz.com/email-fonts"

const roboto = `${EMAIL_FONT_BASE_URL}/roboto-latin.woff2`
const robotoCondensed = `${EMAIL_FONT_BASE_URL}/roboto-condensed-latin.woff2`

export function MuseMarketingEmailFonts() {
  return (
    <>
      {[400, 500, 700].map((fontWeight) => (
        <Font
          key={`roboto-${fontWeight}`}
          fontFamily="Roboto"
          fallbackFontFamily={["Arial", "Helvetica", "sans-serif"]}
          webFont={{ url: roboto, format: "woff2" }}
          fontStyle="normal"
          fontWeight={fontWeight}
        />
      ))}
      {[400, 700].map((fontWeight) => (
        <Font
          key={`roboto-condensed-${fontWeight}`}
          fontFamily="Roboto Condensed"
          fallbackFontFamily={["Arial", "sans-serif"]}
          webFont={{ url: robotoCondensed, format: "woff2" }}
          fontStyle="normal"
          fontWeight={fontWeight}
        />
      ))}
    </>
  )
}
