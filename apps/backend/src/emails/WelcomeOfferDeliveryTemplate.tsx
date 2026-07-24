import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import React from "react"
import { bgcolor, colors, DARK_MODE_OVERRIDE_STYLE, FONT_STACK, icons, logoUrl } from "./theme"
import { MuseEmailFonts } from "./MuseEmailFonts"

export type WelcomeOfferDeliveryEmailProps = {
  previewText: string
  firstName?: string | null
  code: string
  expiresAt: string
  unsubscribeUrl: string
  shopUrl: string
}

const palette = {
  black: "#212121",
  cream: "#F7F6EC",
  acid: "#DDDD6B",
  clay: "#B1562B",
  paper: "#FFFEFC",
  muted: "#68675F",
  mutedOnDark: "#A9A89C",
  border: "#DDDCCF",
}

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
  color: palette.cream,
  fontFamily: FONT_STACK,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "underline",
}

export function WelcomeOfferDeliveryEmail(props: WelcomeOfferDeliveryEmailProps) {
  const greeting = props.firstName || "there"
  const storefrontBase = storefrontBaseFromShopUrl(props.shopUrl)
  const faqUrl = `${storefrontBase}/faq`
  const trackUrl = `${storefrontBase}/track`

  return (
    <Html>
      <Head>
        <MuseEmailFonts />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{DARK_MODE_OVERRIDE_STYLE}</style>
      </Head>
      <Preview>{props.previewText}</Preview>
      <Body
        className="em-bg-page"
        style={{
          backgroundColor: palette.cream,
          color: palette.black,
          fontFamily: FONT_STACK,
          margin: 0,
          padding: 0,
        }}
        {...bgcolor(palette.cream)}
      >
        <Container
          className="em-bg-card"
          style={{
            backgroundColor: palette.paper,
            margin: "0 auto",
            maxWidth: 600,
            width: "100%",
          }}
          {...bgcolor(palette.paper)}
        >
          <Section
            className="em-bg-dark"
            style={{ backgroundColor: palette.black, padding: "20px 0", textAlign: "center" }}
            {...bgcolor(palette.black)}
          >
            <Img
              src={logoUrl}
              width="160"
              height="34"
              alt="MUSE"
              style={{ display: "block", height: "auto", margin: "0 auto", maxWidth: 160, width: "100%" }}
            />
          </Section>

          <Section
            className="em-bg-page"
            style={{ backgroundColor: palette.cream, padding: "40px 32px 32px", textAlign: "center" }}
            {...bgcolor(palette.cream)}
          >
            <Text
              style={{
                color: palette.clay,
                fontFamily: displayFont,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                margin: "0 0 16px",
                textTransform: "uppercase",
              }}
            >
              WELCOME TO MUSE
            </Text>
            <Text style={{ color: palette.black, fontSize: 16, margin: "0 0 12px" }}>
              Hey {greeting},
            </Text>
            <Heading
              style={{
                color: palette.black,
                fontFamily: displayFont,
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: "0.01em",
                lineHeight: "1.15",
                margin: "0 0 18px",
                textTransform: "uppercase",
              }}
            >
              YOUR NZ$20
              <br />
              WELCOME IS
              <br />
              HERE
            </Heading>
            <Text style={{ color: palette.black, fontSize: 16, lineHeight: "1.55", margin: 0 }}>
              Your first-order code is ready. Use it when you spend NZ$150 or more.
            </Text>
          </Section>

          <Section
            className="em-bg-page"
            style={{ backgroundColor: palette.cream, padding: "0 32px 28px" }}
            {...bgcolor(palette.cream)}
          >
            <Section
              style={{
                backgroundColor: palette.acid,
                border: `2px solid ${palette.black}`,
                padding: "26px 24px",
                textAlign: "center",
              }}
              {...bgcolor(palette.acid)}
            >
              <Text
                style={{
                  color: palette.black,
                  fontFamily: displayFont,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  margin: "0 0 10px",
                  textTransform: "uppercase",
                }}
              >
                YOUR UNIQUE CODE
              </Text>
              <Text
                style={{
                  color: palette.black,
                  fontFamily: displayFont,
                  fontSize: 30,
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  margin: "0 0 10px",
                  overflowWrap: "anywhere",
                }}
              >
                {props.code}
              </Text>
              <Text style={{ color: palette.black, fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>
                Expires {props.expiresAt}
              </Text>
              <Text style={{ color: palette.black, fontSize: 13, margin: 0 }}>
                Single use. First qualifying order only.
              </Text>
            </Section>
          </Section>

          <Section
            className="em-bg-page"
            style={{ backgroundColor: palette.cream, padding: "0 32px 36px", textAlign: "center" }}
            {...bgcolor(palette.cream)}
          >
            <Link
              href={props.shopUrl}
              style={{
                backgroundColor: palette.black,
                color: palette.cream,
                display: "inline-block",
                fontFamily: displayFont,
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "0.02em",
                minWidth: 160,
                padding: "16px 44px",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              SHOP ALL
            </Link>
          </Section>

          <Section
            className="em-bg-card"
            style={{
              backgroundColor: palette.paper,
              borderBottom: `1px solid ${palette.border}`,
              borderTop: `1px solid ${palette.border}`,
              padding: "32px",
            }}
            {...bgcolor(palette.paper)}
          >
            <Text
              style={{
                color: palette.black,
                fontFamily: displayFont,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.1em",
                margin: "0 0 18px",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              HOW TO USE IT
            </Text>
            <Text style={{ color: palette.black, fontSize: 15, margin: "0 0 10px" }}>
              <strong style={{ color: palette.clay }}>01</strong>
              {" — Find something you like"}
            </Text>
            <Text style={{ color: palette.black, fontSize: 15, margin: "0 0 10px" }}>
              <strong style={{ color: palette.clay }}>02</strong>
              {" — Spend NZ$150 or more"}
            </Text>
            <Text style={{ color: palette.black, fontSize: 15, margin: 0 }}>
              <strong style={{ color: palette.clay }}>03</strong>
              {" — Enter your unique code at checkout"}
            </Text>
          </Section>

          <Section
            className="em-bg-page"
            style={{ backgroundColor: palette.cream, padding: "28px 32px", textAlign: "center" }}
            {...bgcolor(palette.cream)}
          >
            <Text
              style={{
                color: palette.black,
                fontFamily: displayFont,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.02em",
                margin: "0 0 6px",
                textTransform: "uppercase",
              }}
            >
              NEED HELP CHOOSING?
            </Text>
            <Text style={{ color: palette.muted, fontSize: 15, margin: 0 }}>
              Reply to this email or contact{" "}
              <Link href="mailto:support@musenz.com" style={{ color: palette.clay, textDecoration: "underline" }}>
                support@musenz.com
              </Link>
              .
            </Text>
          </Section>

          <Section
            className="em-bg-dark"
            style={{ backgroundColor: palette.black, padding: "40px 32px 28px", textAlign: "center" }}
            {...bgcolor(palette.black)}
          >
            <Img
              src={logoUrl}
              width="140"
              height="29"
              alt="MUSE"
              style={{ display: "block", height: "auto", margin: "0 auto 18px", maxWidth: 140, width: "100%" }}
            />
            <Text style={{ color: palette.mutedOnDark, fontSize: 14, lineHeight: "1.5", margin: "0 0 20px" }}>
              An online store for footwear, apparel, and everyday essentials. Shop current products with
              tracked delivery, and local support.
            </Text>

            <Section style={{ margin: "0 0 20px", textAlign: "center" }}>
              <Link href="https://instagram.com/muse.nz" style={{ display: "inline-block", margin: "0 10px" }}>
                <Img
                  src={instagramIconUrl}
                  width="26"
                  height="26"
                  alt="MUSE on Instagram"
                  style={{ display: "block" }}
                />
              </Link>
              <Link href="https://facebook.com/muse.nz.2025" style={{ display: "inline-block", margin: "0 10px" }}>
                <Img
                  src={facebookIconUrl}
                  width="26"
                  height="26"
                  alt="MUSE on Facebook"
                  style={{ display: "block" }}
                />
              </Link>
            </Section>

            <Text style={{ lineHeight: "1.9", margin: "0 0 16px" }}>
              <Link href={faqUrl} style={footerLinkStyle}>FAQ</Link>
              <span style={{ color: palette.mutedOnDark }}>{" · "}</span>
              <Link href={trackUrl} style={footerLinkStyle}>TRACK ORDER</Link>
              <span style={{ color: palette.mutedOnDark }}>{" · "}</span>
              <Link href="mailto:support@musenz.com" style={footerLinkStyle}>CONTACT US</Link>
              <span style={{ color: palette.mutedOnDark }}>{" · "}</span>
              <Link href={props.shopUrl} style={footerLinkStyle}>SHOP ALL</Link>
            </Text>

            <Text style={{ color: palette.mutedOnDark, fontSize: 11, margin: "0 0 6px" }}>
              Auckland, New Zealand
            </Text>
            <Text style={{ color: palette.mutedOnDark, fontSize: 11, margin: "0 0 6px" }}>
              © {new Date().getFullYear()} MUSE NZ. All rights reserved.
            </Text>
            <Link
              href={props.unsubscribeUrl}
              style={{ color: palette.mutedOnDark, fontSize: 11, textDecoration: "underline" }}
            >
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
