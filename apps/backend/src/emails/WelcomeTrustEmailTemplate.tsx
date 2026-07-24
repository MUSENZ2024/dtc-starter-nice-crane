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
import { bgcolor, DARK_MODE_OVERRIDE_STYLE, FONT_STACK, icons, logoUrl } from "./theme"
import { MuseEmailFonts } from "./MuseEmailFonts"

export type WelcomeTrustEmailProps = {
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

function TrustRow({
  number,
  title,
  children,
  last = false,
}: {
  number: string
  title: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <Row
      style={{
        borderBottom: last ? "none" : `1px solid ${color.border}`,
        marginBottom: last ? 0 : 24,
        paddingBottom: last ? 0 : 24,
      }}
    >
      <Column style={{ verticalAlign: "top", width: 56 }}>
        <Text
          style={{
            color: color.clay,
            fontFamily: displayFont,
            fontSize: 28,
            fontWeight: 900,
            lineHeight: "1",
            margin: 0,
          }}
        >
          {number}
        </Text>
      </Column>
      <Column style={{ verticalAlign: "top" }}>
        <Text
          style={{
            color: color.black,
            fontFamily: displayFont,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.08em",
            margin: "0 0 6px",
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
        <Text style={{ color: color.black, fontFamily: FONT_STACK, fontSize: 15, lineHeight: "1.6", margin: 0 }}>
          {children}
        </Text>
      </Column>
    </Row>
  )
}

const footerLinkStyle: React.CSSProperties = {
  color: color.cream,
  fontFamily: FONT_STACK,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "underline",
}

export function WelcomeTrustEmail(props: WelcomeTrustEmailProps) {
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
        style={{ backgroundColor: color.cream, color: color.black, fontFamily: FONT_STACK, margin: 0, padding: 0 }}
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
            className="em-bg-page"
            style={{ backgroundColor: color.cream, padding: "56px 40px 44px", textAlign: "center" }}
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
              SHOP WITH CONFIDENCE
            </Text>
            <Text style={{ color: color.black, fontSize: 16, margin: "0 0 20px" }}>
              Hey {greeting},
            </Text>
            <Heading
              as="h2"
              style={{
                color: color.black,
                fontFamily: displayFont,
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: "0.01em",
                lineHeight: "1.15",
                margin: "0 0 22px",
                textTransform: "uppercase",
              }}
            >
              WHAT SHOPPING
              <br />
              WITH MUSE
              <br />
              LOOKS LIKE
            </Heading>
            <Text style={{ color: color.black, fontSize: 16, lineHeight: "1.6", margin: 0 }}>
              Straightforward ordering, tracked delivery and real support when you need it.
            </Text>
          </Section>

          <Section
            className="em-bg-card"
            style={{ backgroundColor: color.paper, padding: "48px 40px" }}
            {...bgcolor(color.paper)}
          >
            <TrustRow number="01" title="Secure Checkout">
              Your payment is processed securely through Stripe.
            </TrustRow>
            <TrustRow number="02" title="Tracked Delivery">
              We’ll send tracking updates so you can follow your order.
            </TrustRow>
            <TrustRow number="03" title="New Zealand Support">
              Questions about an order, product or size? Contact{" "}
              <Link href="mailto:support@musenz.com" style={{ color: color.black, textDecoration: "underline" }}>
                support@musenz.com
              </Link>
              .
            </TrustRow>
            <TrustRow number="04" title="Straightforward Returns" last>
              Eligible orders can be returned within 30 days.
            </TrustRow>
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
            className="em-bg-page"
            style={{ backgroundColor: color.cream, padding: "40px", textAlign: "center" }}
            {...bgcolor(color.cream)}
          >
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
            className="em-bg-page"
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
              NEED A HAND?
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
