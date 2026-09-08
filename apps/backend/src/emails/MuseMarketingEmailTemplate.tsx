import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import React, { type PropsWithChildren } from "react"
import {
  bgcolor,
  colors,
  DARK_MODE_OVERRIDE_STYLE,
  icons,
  logoUrl,
} from "./theme"
import { MuseMarketingEmailFonts } from "./MuseMarketingEmailFonts"

export type MuseMarketingEmailLayoutProps = PropsWithChildren<{
  previewText: string
  unsubscribeUrl: string
  storefrontUrl?: string
  headStyle?: string
}>

const displayFont = "'Roboto Condensed', 'Arial Narrow', Arial, sans-serif"
const bodyFont = "Roboto, Arial, sans-serif"

const responsiveStyle = `
${DARK_MODE_OVERRIDE_STYLE}
@media only screen and (max-width: 600px) {
  .muse-email-nav { padding-left: 12px !important; padding-right: 12px !important; }
  .muse-email-nav-cell { padding-left: 7px !important; padding-right: 7px !important; }
  .muse-email-nav-link { font-size: 10px !important; letter-spacing: 0.03em !important; }
  .muse-email-footer { padding-left: 20px !important; padding-right: 20px !important; }
  .muse-email-logo { width: 148px !important; }
}
`

const normaliseStorefrontUrl = (url: string) => url.replace(/\/$/, "")

export function MuseMarketingEmailLayout({
  children,
  previewText,
  unsubscribeUrl,
  storefrontUrl = process.env.STOREFRONT_URL || "https://musenz.com",
  headStyle = "",
}: MuseMarketingEmailLayoutProps) {
  const storefrontBase = normaliseStorefrontUrl(storefrontUrl)
  const instagramIconUrl = icons.instagram.replace(
    "social-instagram.png",
    "social-instagram-transparent.png"
  )
  const facebookIconUrl = icons.facebook.replace(
    "social-facebook.png",
    "social-facebook-transparent.png"
  )

  const navLinks = [
    { href: `${storefrontBase}/categories/footwear`, label: "Footwear" },
    { href: `${storefrontBase}/categories/outerwear`, label: "Outerwear" },
    { href: `${storefrontBase}/store?stock=nz-stock`, label: "NZ stock" },
    { href: `${storefrontBase}/clearance`, label: "Clearance" },
  ]

  return (
    <Html lang="en">
      <Head>
        <MuseMarketingEmailFonts />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`${responsiveStyle}\n${headStyle}`}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body
        className="em-bg-page"
        style={{
          backgroundColor: colors.cream,
          color: colors.black,
          fontFamily: bodyFont,
          margin: 0,
          padding: 0,
        }}
        {...bgcolor(colors.cream)}
      >
        <Container
          className="em-bg-page"
          style={{
            backgroundColor: colors.cream,
            margin: "0 auto",
            maxWidth: 600,
            width: "100%",
          }}
          {...bgcolor(colors.cream)}
        >
          <Section
            className="em-bg-dark"
            style={{
              backgroundColor: colors.black,
              padding: "26px 24px 22px",
              textAlign: "center",
            }}
            {...bgcolor(colors.black)}
          >
            <Link href={`${storefrontBase}/`} aria-label="Visit MUSE NZ">
              <Img
                className="muse-email-logo"
                src={logoUrl}
                alt="MUSE"
                width="170"
                height="36"
                style={{
                  display: "block",
                  height: "auto",
                  margin: "0 auto",
                  maxWidth: 170,
                  width: "100%",
                }}
              />
            </Link>
          </Section>

          <Section
            className="em-bg-dark muse-email-nav"
            style={{
              backgroundColor: colors.black,
              borderBottom: "1px solid #2E2E2E",
              padding: "0 20px 23px",
              textAlign: "center",
            }}
            {...bgcolor(colors.black)}
          >
            <table
              role="presentation"
              align="center"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              style={{ borderCollapse: "collapse", margin: "0 auto" }}
            >
              <tbody>
                <tr>
                  {navLinks.map((item) => (
                    <td
                      className="muse-email-nav-cell"
                      key={item.label}
                      style={{ padding: "0 13px" }}
                    >
                      <Link
                        className="muse-email-nav-link"
                        href={item.href}
                        style={{
                          color: colors.cream,
                          fontFamily: bodyFont,
                          fontSize: 12,
                          fontWeight: 500,
                          letterSpacing: "0.06em",
                          lineHeight: "44px",
                          textDecoration: "none",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.label}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Section>

          {children}

          <Section
            className="em-bg-dark muse-email-footer"
            style={{
              backgroundColor: colors.black,
              padding: "48px 40px 38px",
              textAlign: "center",
            }}
            {...bgcolor(colors.black)}
          >
            <Link href={`${storefrontBase}/`} aria-label="Visit MUSE NZ">
              <Img
                className="muse-email-logo"
                src={logoUrl}
                alt="MUSE"
                width="150"
                height="32"
                style={{
                  display: "block",
                  height: "auto",
                  margin: "0 auto 25px",
                  maxWidth: 150,
                  width: "100%",
                }}
              />
            </Link>

            <Section style={{ margin: "0 0 30px", textAlign: "center" }}>
              <Link
                href="https://www.instagram.com/muse.nz"
                aria-label="MUSE NZ on Instagram"
                style={{ display: "inline-block", margin: "0 8px" }}
              >
                <Img
                  src={instagramIconUrl}
                  width="24"
                  height="24"
                  alt="Instagram"
                  style={{ display: "block" }}
                />
              </Link>
              <Link
                href="https://www.facebook.com/muse.nz.2025"
                aria-label="MUSE NZ on Facebook"
                style={{ display: "inline-block", margin: "0 8px" }}
              >
                <Img
                  src={facebookIconUrl}
                  width="24"
                  height="24"
                  alt="Facebook"
                  style={{ display: "block" }}
                />
              </Link>
            </Section>

            <Text
              style={{
                color: colors.cream,
                fontFamily: displayFont,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.06em",
                lineHeight: "20px",
                margin: "0 0 8px",
                textTransform: "uppercase",
              }}
            >
              Get in touch with our team
            </Text>
            <Text
              style={{
                color: colors.cream,
                fontFamily: bodyFont,
                fontSize: 13,
                lineHeight: "21px",
                margin: 0,
              }}
            >
              Email:{" "}
              <Link
                href="mailto:support@musenz.com"
                style={{ color: colors.cream, textDecoration: "underline" }}
              >
                support@musenz.com
              </Link>
            </Text>
            <Text
              style={{
                color: "#9C9892",
                fontFamily: bodyFont,
                fontSize: 12,
                lineHeight: "20px",
                margin: "7px 0 0",
              }}
            >
              Auckland, New Zealand
            </Text>

            <Section style={{ borderTop: "1px solid #2E2E2E", marginTop: 30, paddingTop: 27 }}>
              <Text
                style={{
                  color: "#9C9892",
                  fontFamily: bodyFont,
                  fontSize: 11,
                  lineHeight: "18px",
                  margin: 0,
                }}
              >
                Copyright © 2026 MUSE NZ. All rights reserved. Prices in NZD.
              </Text>
              <Link
                href={unsubscribeUrl}
                style={{
                  color: colors.cream,
                  display: "inline-block",
                  fontFamily: bodyFont,
                  fontSize: 11,
                  lineHeight: "18px",
                  marginTop: 12,
                  textDecoration: "underline",
                }}
              >
                Unsubscribe
              </Link>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default MuseMarketingEmailLayout
