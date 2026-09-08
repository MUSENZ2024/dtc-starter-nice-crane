import {
  Button,
  Column,
  Heading,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components"
import React from "react"
import { bgcolor, colors } from "./theme"
import { MuseMarketingEmailLayout } from "./MuseMarketingEmailTemplate"

export type SpringRotationLaunchEmailProps = {
  unsubscribeUrl: string
  previewText?: string
  storefrontUrl?: string
  assetBaseUrl?: string
}

const bodyFont = "Roboto, Arial, sans-serif"
const displayFont = "'Roboto Condensed', 'Arial Narrow', Arial, sans-serif"
const orange = "#C1440E"
const creamWarm = "#FAF8F3"
const merchGrey = "#F4F5F7"
const muted = "#6F6B66"
const divider = "#E5E2DC"

const products = [
  {
    image: "email-onitsuka.jpg",
    name: "Onitsuka Tiger Mexico 66",
    colour: "Silver Off White",
    alt: "Onitsuka Tiger Mexico 66 Silver Off White styled for spring",
    content: "onitsuka",
  },
  {
    image: "email-salomon-pink.jpg",
    name: "Salomon XT-6",
    colour: "Light Pink",
    alt: "Salomon XT-6 Light Pink styled for spring",
    content: "salomon-pink",
  },
  {
    image: "email-new-balance.jpg",
    name: "New Balance 204L",
    colour: "Mushroom Arid Stone",
    alt: "New Balance 204L Mushroom Arid Stone styled for spring",
    content: "new-balance",
  },
  {
    image: "email-puma.jpg",
    name: "Puma Speedcat OG",
    colour: "Black White",
    alt: "Puma Speedcat OG Black White styled for spring",
    content: "puma",
  },
] as const

const responsiveStyle = `
@media only screen and (max-width: 600px) {
  .spring-copy { padding-left: 24px !important; padding-right: 24px !important; }
  .spring-heading { font-size: 34px !important; line-height: 38px !important; }
  .spring-grid { padding-left: 20px !important; padding-right: 20px !important; }
  .spring-product-column { display: block !important; padding: 8px 0 20px !important; width: 100% !important; }
  .spring-product-image { height: auto !important; width: 100% !important; }
  .spring-help-column { display: block !important; padding: 0 0 24px !important; width: 100% !important; }
}
`

const normaliseUrl = (url: string) => url.replace(/\/$/, "")

export function SpringRotationLaunchEmail({
  unsubscribeUrl,
  previewText = "Nine spring styles, with pairs from $140.",
  storefrontUrl = process.env.STOREFRONT_URL || "https://musenz.com",
  assetBaseUrl,
}: SpringRotationLaunchEmailProps) {
  const storefrontBase = normaliseUrl(storefrontUrl)
  const campaignAssets = normaliseUrl(
    assetBaseUrl || `${storefrontBase}/campaigns/spring-rotation`
  )
  const campaignUrl = (content: string) =>
    `${storefrontBase}/collections/spring-rotation?utm_source=muse_email&utm_medium=email&utm_campaign=spring_rotation_launch&utm_content=${content}`

  const productRows = [products.slice(0, 2), products.slice(2, 4)]

  return (
    <MuseMarketingEmailLayout
      headStyle={responsiveStyle}
      previewText={previewText}
      unsubscribeUrl={unsubscribeUrl}
      storefrontUrl={storefrontBase}
    >
      <Link href={campaignUrl("hero-image")} style={{ display: "block" }}>
        <Img
          src={`${campaignAssets}/email-hero.jpg`}
          alt="MUSE Spring Rotation sale. Pairs from $140."
          width="600"
          height="400"
          style={{ display: "block", height: "auto", maxWidth: 600, width: "100%" }}
        />
      </Link>

      <Section
        className="em-bg-page spring-copy"
        style={{ backgroundColor: colors.cream, padding: "32px 40px 44px", textAlign: "left" }}
        {...bgcolor(colors.cream)}
      >
        <Text
          style={{
            color: muted,
            fontFamily: bodyFont,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.08em",
            lineHeight: "16px",
            margin: "0 0 16px",
            textTransform: "uppercase",
          }}
        >
          MUSE seasonal edit · Spring 2026
        </Text>
        <Heading
          as="h1"
          className="spring-heading"
          style={{
            color: colors.black,
            fontFamily: displayFont,
            fontSize: 44,
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: "48px",
            margin: "0 0 20px",
          }}
        >
          Find your spring pair
        </Heading>
        <Text
          style={{
            color: "#231F20",
            fontFamily: bodyFont,
            fontSize: 16,
            lineHeight: "26px",
            margin: "0 0 20px",
          }}
        >
          Shop nine spring styles from $140. Check sizes, photos and delivery on each product page.
        </Text>
        <Button
          href={campaignUrl("intro-cta")}
          style={{
            backgroundColor: orange,
            borderRadius: 2,
            color: creamWarm,
            display: "inline-block",
            fontFamily: bodyFont,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "0.06em",
            lineHeight: "20px",
            padding: "16px 32px",
            textDecoration: "none",
            textTransform: "uppercase",
          }}
        >
          Shop the rotation
        </Button>
      </Section>

      <Section
        className="em-bg-card spring-copy"
        style={{
          backgroundColor: creamWarm,
          borderTop: `1px solid ${divider}`,
          padding: "56px 40px 28px",
        }}
        {...bgcolor(creamWarm)}
      >
        <Text
          style={{
            color: muted,
            fontFamily: bodyFont,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.08em",
            lineHeight: "16px",
            margin: "0 0 14px",
            textTransform: "uppercase",
          }}
        >
          Four from the edit
        </Text>
        <Heading
          as="h2"
          style={{
            color: colors.black,
            fontFamily: displayFont,
            fontSize: 26,
            fontWeight: 400,
            lineHeight: "31px",
            margin: 0,
          }}
        >
          Start with the shape you wear most
        </Heading>
      </Section>

      <Section
        className="em-bg-card spring-grid"
        style={{ backgroundColor: creamWarm, padding: "0 32px 48px" }}
        {...bgcolor(creamWarm)}
      >
        {productRows.map((row, rowIndex) => (
          <Row key={rowIndex}>
            {row.map((product) => (
              <Column
                className="spring-product-column"
                key={product.name}
                style={{ padding: "12px 8px 20px", verticalAlign: "top", width: "50%" }}
              >
                <Link href={campaignUrl(product.content)} style={{ display: "block" }}>
                  <Img
                    className="spring-product-image"
                    src={`${campaignAssets}/${product.image}`}
                    alt={product.alt}
                    width="252"
                    height="336"
                    style={{ display: "block", height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </Link>
                <Heading
                  as="h3"
                  style={{
                    color: colors.black,
                    fontFamily: displayFont,
                    fontSize: 19,
                    fontWeight: 700,
                    lineHeight: "23px",
                    margin: "16px 0 4px",
                  }}
                >
                  {product.name}
                </Heading>
                <Text
                  style={{
                    color: muted,
                    fontFamily: bodyFont,
                    fontSize: 13,
                    lineHeight: "20px",
                    margin: "0 0 11px",
                  }}
                >
                  {product.colour}
                </Text>
                <Link
                  href={campaignUrl(`${product.content}-link`)}
                  style={{
                    color: colors.black,
                    fontFamily: bodyFont,
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: "20px",
                    textDecoration: "underline",
                  }}
                >
                  View in the edit
                </Link>
              </Column>
            ))}
          </Row>
        ))}
      </Section>

      <Section
        className="em-bg-page spring-copy"
        style={{ backgroundColor: colors.cream, padding: "56px 40px 32px" }}
        {...bgcolor(colors.cream)}
      >
        <Heading
          as="h2"
          style={{
            color: colors.black,
            fontFamily: displayFont,
            fontSize: 25,
            fontWeight: 400,
            lineHeight: "30px",
            margin: "0 0 28px",
          }}
        >
          Check the details before you choose
        </Heading>
        <Row>
          <Column className="spring-help-column" style={{ padding: "0 16px 0 0", verticalAlign: "top", width: "50%" }}>
            <Text
              style={{
                color: colors.black,
                fontFamily: displayFont,
                fontSize: 17,
                fontWeight: 700,
                lineHeight: "22px",
                margin: "0 0 8px",
              }}
            >
              Find your size
            </Text>
            <Text style={{ color: muted, fontFamily: bodyFont, fontSize: 14, lineHeight: "22px", margin: 0 }}>
              Open the product page to see its size options and size guide.
            </Text>
          </Column>
          <Column className="spring-help-column" style={{ padding: "0 0 0 16px", verticalAlign: "top", width: "50%" }}>
            <Text
              style={{
                color: colors.black,
                fontFamily: displayFont,
                fontSize: 17,
                fontWeight: 700,
                lineHeight: "22px",
                margin: "0 0 8px",
              }}
            >
              Check delivery
            </Text>
            <Text style={{ color: muted, fontFamily: bodyFont, fontSize: 14, lineHeight: "22px", margin: 0 }}>
              Your selected pair shows its fulfilment label and delivery estimate.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section
        style={{ backgroundColor: merchGrey, padding: "48px 40px", textAlign: "center" }}
        {...bgcolor(merchGrey)}
      >
        <Text
          style={{
            color: orange,
            fontFamily: bodyFont,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            lineHeight: "16px",
            margin: "0 0 12px",
            textTransform: "uppercase",
          }}
        >
          Pairs from $140
        </Text>
        <Heading
          as="h2"
          style={{
            color: colors.black,
            fontFamily: displayFont,
            fontSize: 28,
            fontWeight: 400,
            lineHeight: "33px",
            margin: "0 0 14px",
          }}
        >
          See all nine styles
        </Heading>
        <Text
          style={{
            color: muted,
            fontFamily: bodyFont,
            fontSize: 14,
            lineHeight: "22px",
            margin: "0 0 26px",
          }}
        >
          Prices, sizes and delivery estimates appear on the collection and product pages.
        </Text>
        <Button
          href={campaignUrl("final-cta")}
          style={{
            backgroundColor: orange,
            borderRadius: 2,
            color: creamWarm,
            display: "inline-block",
            fontFamily: bodyFont,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "0.06em",
            lineHeight: "20px",
            padding: "16px 32px",
            textDecoration: "none",
            textTransform: "uppercase",
          }}
        >
          Shop the rotation
        </Button>
      </Section>
    </MuseMarketingEmailLayout>
  )
}

export default SpringRotationLaunchEmail
