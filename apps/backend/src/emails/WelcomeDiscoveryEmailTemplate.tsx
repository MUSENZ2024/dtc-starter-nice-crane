import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"
import React from "react"
import { bgcolor, DARK_MODE_OVERRIDE_STYLE, icons, logoUrl } from "./theme"
import { MuseEmailFonts } from "./MuseEmailFonts"

export type WelcomeDiscoveryEmailProps = {
  previewText: string
  firstName?: string | null
  code: string
  expiresAt: string
  unsubscribeUrl: string
  shopUrl: string
}

const color = {
  black: "#212121",
  cream: "#F7F6EC",
  acid: "#DDDD6B",
  clay: "#B1562B",
  paper: "#FFFEFC",
  muted: "#68675F",
  mutedOnDark: "#A9A89C",
  border: "#DDDCCF",
}

const bodyFont = "'Inter', Arial, Helvetica, sans-serif"
const displayFont = "'Raleway', Arial, Helvetica, sans-serif"
const instagramIconUrl = icons.instagram.replace("social-instagram.png", "social-instagram-transparent.png")
const facebookIconUrl = icons.facebook.replace("social-facebook.png", "social-facebook-transparent.png")

const storefrontBaseFromShopUrl = (shopUrl: string) => {
  try {
    const url = new URL(shopUrl)
    const pathname = url.pathname.replace(/\/store\/?$/, "")
    return `${url.origin}${pathname}`.replace(/\/$/, "")
  } catch {
    return shopUrl.replace(/\/store\/?([?#].*)?$/, "")
  }
}

const PRODUCT_IMAGE_FILENAMES = {
  "nuptse-jacket-black": "nuptse-jacket-black-square.jpg",
  "birkenstock-boston-soft-footbed-suede-taupe-nz-stock": "birkenstock-boston-taupe-square.jpg",
  "nuptse-vest-black": "nuptse-vest-black-square.jpg",
  "asics-gel-kayano-14-white-graphite-grey": "asics-gel-kayano-14-square.jpg",
} as const

const products = [
  {
    handle: "nuptse-jacket-black",
    name: "The North Face 1996 Retro Nuptse Jacket — Black",
  },
  {
    handle: "birkenstock-boston-soft-footbed-suede-taupe-nz-stock",
    name: "Birkenstock Boston Soft Footbed Suede — Taupe",
  },
  {
    handle: "nuptse-vest-black",
    name: "The North Face 1996 Retro Nuptse Vest — Black",
  },
  {
    handle: "asics-gel-kayano-14-white-graphite-grey",
    name: "ASICS Gel-Kayano 14 — White Graphite Grey",
  },
] as const

const productRows = [products.slice(0, 2), products.slice(2, 4)]

const footerLinkStyle: React.CSSProperties = {
  color: color.cream,
  fontFamily: bodyFont,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "underline",
}

const responsiveStyle = `
${DARK_MODE_OVERRIDE_STYLE}
@media only screen and (max-width: 600px) {
  .discovery-hero { padding: 44px 24px 34px !important; }
  .discovery-heading { font-size: 32px !important; }
  .discovery-products { padding: 8px 20px 32px !important; }
  .discovery-product-col {
    display: block !important;
    padding: 8px 0 !important;
    width: 100% !important;
  }
  .discovery-product-image {
    height: auto !important;
    width: 100% !important;
  }
  .discovery-section-pad { padding-left: 24px !important; padding-right: 24px !important; }
}
`

export function WelcomeDiscoveryEmail(props: WelcomeDiscoveryEmailProps) {
  const greeting = props.firstName || "there"
  const storefrontBase = storefrontBaseFromShopUrl(props.shopUrl)
  const productImageBase =
    process.env.MUSE_EMAIL_PRODUCT_IMAGE_BASE_URL || `${storefrontBase}/email-products`
  const faqUrl = `${storefrontBase}/faq`
  const trackUrl = `${storefrontBase}/track`

  return (
    <Html>
      <Head>
        <MuseEmailFonts />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{responsiveStyle}</style>
      </Head>
      <Preview>{props.previewText}</Preview>
      <Body
        className="em-bg-page"
        style={{ backgroundColor: color.cream, color: color.black, fontFamily: bodyFont, margin: 0, padding: 0 }}
        {...bgcolor(color.cream)}
      >
        <Container
          className="em-bg-page"
          style={{ backgroundColor: color.cream, margin: "0 auto", maxWidth: 600, width: "100%" }}
          {...bgcolor(color.cream)}
        >
          <Section
            className="em-bg-dark"
            style={{ backgroundColor: color.black, padding: "25px 0", textAlign: "center" }}
            {...bgcolor(color.black)}
          >
            <Img
              src={logoUrl}
              alt="MUSE"
              width="150"
              height="32"
              style={{ display: "block", height: "auto", margin: "0 auto", maxWidth: 150, width: "100%" }}
            />
          </Section>

          <Section
            className="em-bg-page discovery-hero"
            style={{ backgroundColor: color.cream, padding: "56px 40px 40px", textAlign: "center" }}
            {...bgcolor(color.cream)}
          >
            <Text
              style={{
                color: color.clay,
                fontFamily: displayFont,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                margin: "0 0 18px",
                textTransform: "uppercase",
              }}
            >
              THE MUSE LINE-UP
            </Text>
            <Text style={{ color: color.black, fontSize: 16, margin: "0 0 18px" }}>
              Hey {greeting},
            </Text>
            <Heading
              as="h2"
              className="discovery-heading"
              style={{
                color: color.black,
                fontFamily: displayFont,
                fontSize: 40,
                fontWeight: 900,
                letterSpacing: "0.01em",
                lineHeight: "1.12",
                margin: "0 0 22px",
                textTransform: "uppercase",
              }}
            >
              FOUR PIECES
              <br />
              WORTH KNOWING
              <br />
              ABOUT
            </Heading>
            <Text style={{ color: color.muted, fontSize: 16, lineHeight: "1.55", margin: 0 }}>
              Outerwear, footwear and everyday favourites from MUSE. Stock and availability are always
              confirmed on the product page.
            </Text>
          </Section>

          <Section className="discovery-products" style={{ padding: "8px 40px 40px" }}>
            {productRows.map((row, rowIndex) => (
              <Row key={rowIndex}>
                {row.map((product) => {
                  const href = `${storefrontBase}/products/${product.handle}`
                  const imageUrl = `${productImageBase}/${PRODUCT_IMAGE_FILENAMES[product.handle]}`
                  return (
                    <Column
                      className="discovery-product-col"
                      key={product.handle}
                      style={{ padding: 8, verticalAlign: "top", width: "50%" }}
                    >
                      <Section
                        className="em-bg-card"
                        style={{ backgroundColor: color.paper, border: `1px solid ${color.border}` }}
                        {...bgcolor(color.paper)}
                      >
                        <Link href={href} style={{ display: "block" }}>
                          <Img
                            alt={product.name}
                            className="discovery-product-image"
                            height="240"
                            src={imageUrl}
                            width="240"
                            style={{ display: "block", height: "auto", maxWidth: "100%", width: "100%" }}
                          />
                        </Link>
                        <Section style={{ padding: "18px 18px 22px" }}>
                          <Link
                            href={href}
                            style={{
                              color: color.black,
                              display: "block",
                              fontFamily: displayFont,
                              fontSize: 14,
                              fontWeight: 800,
                              lineHeight: "1.3",
                              margin: "0 0 12px",
                              textDecoration: "none",
                              textTransform: "uppercase",
                            }}
                          >
                            {product.name}
                          </Link>
                          <Link
                            href={href}
                            style={{
                              color: color.black,
                              fontSize: 13,
                              fontWeight: 600,
                              textDecoration: "underline",
                            }}
                          >
                            VIEW PRODUCT
                          </Link>
                        </Section>
                      </Section>
                    </Column>
                  )
                })}
              </Row>
            ))}
            <Text style={{ color: color.muted, fontSize: 13, margin: "24px 0 0", textAlign: "center" }}>
              Stock, sizes and availability are confirmed on each product page.
            </Text>
          </Section>

          <Section
            style={{ backgroundColor: color.acid, padding: "36px 40px", textAlign: "center" }}
            {...bgcolor(color.acid)}
          >
            <Text
              style={{
                color: color.black,
                fontFamily: displayFont,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                margin: "0 0 12px",
                textTransform: "uppercase",
              }}
            >
              YOUR WELCOME CODE
            </Text>
            <Text
              style={{
                color: color.black,
                fontFamily: displayFont,
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: "0.04em",
                margin: "0 0 12px",
                overflowWrap: "anywhere",
              }}
            >
              {props.code}
            </Text>
            <Text style={{ color: color.black, fontSize: 14, lineHeight: "1.5", margin: "0 0 6px" }}>
              NZ$20 off your first qualifying order of NZ$150 or more.
            </Text>
            <Text style={{ color: color.black, fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
              Expires {props.expiresAt}
            </Text>
            <Text style={{ color: color.black, fontSize: 12, margin: 0 }}>
              Single use. First qualifying order only.
            </Text>
          </Section>

          <Section
            className="em-bg-page discovery-section-pad"
            style={{ backgroundColor: color.cream, padding: "40px", textAlign: "center" }}
            {...bgcolor(color.cream)}
          >
            <Text style={{ color: color.black, fontSize: 16, margin: "0 0 18px" }}>
              Find something you like.
            </Text>
            <Link
              href={props.shopUrl}
              style={{
                backgroundColor: color.black,
                color: color.cream,
                display: "inline-block",
                fontFamily: displayFont,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.02em",
                lineHeight: "44px",
                minHeight: 44,
                minWidth: 160,
                padding: "0 32px",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              SHOP ALL
            </Link>
          </Section>

          <Section
            className="em-bg-page discovery-section-pad"
            style={{
              backgroundColor: color.cream,
              borderTop: `1px solid ${color.border}`,
              padding: "32px 40px 48px",
              textAlign: "center",
            }}
            {...bgcolor(color.cream)}
          >
            <Heading
              as="h3"
              style={{
                color: color.black,
                fontFamily: displayFont,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.04em",
                margin: "0 0 10px",
                textTransform: "uppercase",
              }}
            >
              NEED HELP CHOOSING?
            </Heading>
            <Text style={{ color: color.black, fontSize: 15, lineHeight: "1.6", margin: 0 }}>
              Reply to this email or contact{" "}
              <Link href="mailto:support@musenz.com" style={{ color: color.black, textDecoration: "underline" }}>
                support@musenz.com
              </Link>
              .
            </Text>
          </Section>

          <Section
            className="em-bg-dark"
            style={{ backgroundColor: color.black, padding: "40px 32px 28px", textAlign: "center" }}
            {...bgcolor(color.black)}
          >
            <Img
              src={logoUrl}
              alt="MUSE"
              width="140"
              height="29"
              style={{ display: "block", height: "auto", margin: "0 auto 18px", maxWidth: 140, width: "100%" }}
            />
            <Text style={{ color: color.mutedOnDark, fontSize: 14, lineHeight: "1.5", margin: "0 0 20px" }}>
              An online store for footwear, apparel, and everyday essentials. Shop current products with
              tracked delivery, and local support.
            </Text>
            <Section style={{ margin: "0 0 20px", textAlign: "center" }}>
              <Link href="https://instagram.com/muse.nz" style={{ display: "inline-block", margin: "0 10px" }}>
                <Img src={instagramIconUrl} width="26" height="26" alt="MUSE on Instagram" style={{ display: "block" }} />
              </Link>
              <Link href="https://facebook.com/muse.nz.2025" style={{ display: "inline-block", margin: "0 10px" }}>
                <Img src={facebookIconUrl} width="26" height="26" alt="MUSE on Facebook" style={{ display: "block" }} />
              </Link>
            </Section>
            <Text style={{ lineHeight: "1.9", margin: "0 0 16px" }}>
              <Link href={faqUrl} style={footerLinkStyle}>FAQ</Link>
              <span style={{ color: color.mutedOnDark }}>{" · "}</span>
              <Link href={trackUrl} style={footerLinkStyle}>TRACK ORDER</Link>
              <span style={{ color: color.mutedOnDark }}>{" · "}</span>
              <Link href="mailto:support@musenz.com" style={footerLinkStyle}>CONTACT US</Link>
              <span style={{ color: color.mutedOnDark }}>{" · "}</span>
              <Link href={props.shopUrl} style={footerLinkStyle}>SHOP ALL</Link>
            </Text>
            <Text style={{ color: color.mutedOnDark, fontSize: 11, margin: "0 0 6px" }}>
              Auckland, New Zealand
            </Text>
            <Text style={{ color: color.mutedOnDark, fontSize: 11, margin: "0 0 6px" }}>
              © {new Date().getFullYear()} MUSE NZ. All rights reserved.
            </Text>
            <Link href={props.unsubscribeUrl} style={{ color: color.mutedOnDark, fontSize: 11, textDecoration: "underline" }}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
