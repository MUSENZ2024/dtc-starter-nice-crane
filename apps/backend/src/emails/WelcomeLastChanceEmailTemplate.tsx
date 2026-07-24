import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import React from "react"
import { bgcolor, DARK_MODE_OVERRIDE_STYLE, icons, logoUrl } from "./theme"
import { MuseEmailFonts } from "./MuseEmailFonts"

export type WelcomeLastChanceEmailProps = {
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
  .last-chance-message { padding: 44px 24px 34px !important; }
  .last-chance-heading { font-size: 32px !important; }
  .last-chance-offer { margin-left: 20px !important; margin-right: 20px !important; padding: 28px 20px !important; }
  .last-chance-code { font-size: 26px !important; padding-left: 12px !important; padding-right: 12px !important; }
  .last-chance-section { padding-left: 24px !important; padding-right: 24px !important; }
}
`

export function WelcomeLastChanceEmail(props: WelcomeLastChanceEmailProps) {
  const greeting = props.firstName || "there"
  const storefrontBase = storefrontBaseFromShopUrl(props.shopUrl)
  const faqUrl = `${storefrontBase}/faq`
  const trackUrl = `${storefrontBase}/track`

  return (
    <Html lang="en">
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
            className="em-bg-page last-chance-message"
            style={{ backgroundColor: color.cream, padding: "56px 48px 40px", textAlign: "center" }}
            {...bgcolor(color.cream)}
          >
            <Text
              style={{
                color: color.clay,
                fontFamily: displayFont,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.12em",
                margin: "0 0 18px",
                textTransform: "uppercase",
              }}
            >
              FINAL REMINDER
            </Text>
            <Text style={{ color: color.black, fontSize: 16, margin: "0 0 18px" }}>
              Hey {greeting},
            </Text>
            <Heading
              as="h1"
              className="last-chance-heading"
              style={{
                color: color.black,
                fontFamily: displayFont,
                fontSize: 36,
                fontWeight: 900,
                lineHeight: "1.15",
                margin: "0 0 20px",
                textTransform: "uppercase",
              }}
            >
              YOUR NZ$20
              <br />
              WELCOME OFFER
              <br />
              ENDS TONIGHT
            </Heading>
            <Text style={{ color: color.black, fontSize: 16, lineHeight: "1.55", margin: 0 }}>
              A quick reminder—your NZ$20 welcome offer ends tonight. Use your code before the expiry
              time shown below on your first qualifying order of NZ$150 or more.
            </Text>
          </Section>

          <Section
            className="em-bg-dark last-chance-offer"
            style={{
              backgroundColor: color.black,
              margin: "0 40px 36px",
              padding: "32px",
              textAlign: "center",
            }}
            {...bgcolor(color.black)}
          >
            <Text
              style={{
                color: color.acid,
                fontFamily: displayFont,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                margin: "0 0 14px",
                textTransform: "uppercase",
              }}
            >
              YOUR WELCOME CODE
            </Text>
            <Text
              className="last-chance-code"
              style={{
                border: `1px dashed ${color.acid}`,
                color: color.acid,
                display: "inline-block",
                fontFamily: displayFont,
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: "0.04em",
                margin: "0 0 18px",
                overflowWrap: "anywhere",
                padding: "14px 20px",
              }}
            >
              {props.code}
            </Text>
            <Text style={{ color: color.cream, fontSize: 15, lineHeight: "1.5", margin: "0 0 8px" }}>
              NZ$20 off your first qualifying order of NZ$150 or more.
            </Text>
            <Text
              style={{
                color: color.cream,
                fontFamily: displayFont,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.02em",
                margin: "0 0 14px",
              }}
            >
              Expires {props.expiresAt}
            </Text>
            <Text style={{ color: color.mutedOnDark, fontSize: 11, margin: 0 }}>
              Single use. First qualifying order only.
            </Text>
          </Section>

          <Section className="last-chance-section" style={{ padding: "0 40px 44px", textAlign: "center" }}>
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
                padding: "0 36px",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              USE MY CODE
            </Link>
          </Section>

          <Hr style={{ borderColor: color.border, margin: "0 40px" }} />

          <Section className="last-chance-section" style={{ padding: "36px 48px 44px", textAlign: "center" }}>
            <Heading
              as="h3"
              style={{
                color: color.black,
                fontFamily: displayFont,
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "0.08em",
                margin: "0 0 10px",
                textTransform: "uppercase",
              }}
            >
              NEED A HAND?
            </Heading>
            <Text style={{ color: color.black, fontSize: 14, lineHeight: "1.6", margin: 0 }}>
              Reply to this email or contact{" "}
              <Link href="mailto:support@musenz.com" style={{ color: color.clay, textDecoration: "underline" }}>
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
