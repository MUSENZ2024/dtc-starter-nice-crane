import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"
import { bgcolor, colors, DARK_MODE_OVERRIDE_STYLE, FONT_STACK, FulfillmentType, icons, logoUrl } from "./theme"
import type { EmailItem } from "./OrderConfirmationTemplate"

export type ShipmentTimelineStage =
  | "confirmed"
  | "packed"
  | "international_transit"
  | "arrived_nz"
  | "shipped"
  | "delivered"

export type OrderShippedProps = {
  customerName: string
  customerEmail: string
  displayId: string
  currencyCode: string
  shippingMethodLabel: string
  carrierName: string
  trackingNumber: string
  trackingUrl: string
  shippedAt: string
  estimatedDeliveryLabel: string
  addressLines: string[]
  phone?: string | null
  items: EmailItem[]
  fulfillmentType: FulfillmentType
  currentStage?: ShipmentTimelineStage
}

const textStyle = {
  fontFamily: FONT_STACK,
  color: colors.text,
}

const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: "20px",
  padding: "30px 26px",
  marginBottom: "16px",
}

const softCardStyle = {
  backgroundColor: colors.creamDeep,
  borderRadius: "16px",
  padding: "16px",
}

const cardTitleStyle = {
  ...textStyle,
  fontSize: "12px",
  fontWeight: "bold" as const,
  letterSpacing: "0.1em",
  color: colors.muted,
  margin: "0 0 18px",
}

const SHIPMENT_TIMELINE: Record<FulfillmentType, { key: ShipmentTimelineStage; title: string; desc: string }[]> = {
  nzstock: [
    { key: "confirmed", title: "Order confirmed", desc: "Your payment went through and your order is locked in." },
    { key: "packed", title: "Packed in Auckland", desc: "Quality-checked and packed by our team." },
    { key: "shipped", title: "Shipped", desc: "Tracking number sent by email once it leaves our workspace." },
    { key: "delivered", title: "Delivered", desc: "Tag @muse.nz when you wear it — 10% off your next order." },
  ],
  standard: [
    { key: "confirmed", title: "Order confirmed", desc: "Your payment went through and your order is locked in." },
    { key: "packed", title: "Being prepped", desc: "Quality-checked and packed by our team." },
    { key: "international_transit", title: "International transit", desc: "On its way from our overseas warehouse." },
    { key: "arrived_nz", title: "Arrived in New Zealand", desc: "Handed to the courier for final delivery." },
    { key: "delivered", title: "Delivered", desc: "Tag @muse.nz when you wear it — 10% off your next order." },
  ],
}

function AddressLines({ lines, phone }: { lines: string[]; phone?: string | null }) {
  return (
    <>
      {lines.map((line, index) => (
        <Text
          key={index}
          style={{
            ...textStyle,
            color: index === 0 ? colors.black : colors.muted,
            fontWeight: index === 0 ? "bold" : "normal",
            fontSize: "13.5px",
            lineHeight: "1.5",
            margin: index === 0 ? "0 0 4px" : "2px 0",
          }}
        >
          {line}
        </Text>
      ))}
      {phone ? (
        <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", margin: "10px 0 0" }}>
          Phone: {phone}
        </Text>
      ) : null}
    </>
  )
}

function IconSquare({ src, alt }: { src: string; alt: string }) {
  return (
    <table cellPadding="0" cellSpacing="0" role="presentation" bgcolor={colors.black}>
      <tr>
        <td
          {...bgcolor(colors.black)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "11px",
            backgroundColor: colors.black,
            textAlign: "center",
            verticalAlign: "middle",
          }}
        >
          <Img src={src} alt={alt} width="18" height="18" style={{ margin: "0 auto" }} />
        </td>
      </tr>
    </table>
  )
}

function SocialIcon({ href, src, alt }: { href: string; src: string; alt: string }) {
  return (
    <a href={href} style={{ textDecoration: "none" }}>
      <table cellPadding="0" cellSpacing="0" role="presentation" style={{ display: "inline-table", marginRight: "12px" }}>
        <tr>
          <td style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)", textAlign: "center", verticalAlign: "middle" }}>
            <Img src={src} alt={alt} width="18" height="18" style={{ margin: "0 auto" }} />
          </td>
        </tr>
      </table>
    </a>
  )
}

function Timeline({
  type,
  currentStage = "international_transit",
}: {
  type: FulfillmentType
  currentStage?: ShipmentTimelineStage
}) {
  const steps = SHIPMENT_TIMELINE[type]
  const normalizedStage = currentStage === "shipped" ? "international_transit" : currentStage
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === normalizedStage)
  )

  return (
    <>
      {steps.map((step, index) => {
        const done = index <= currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === steps.length - 1
        const dotColor = done ? colors.green : colors.creamDeep

        return (
          <Row key={step.key}>
            <Column style={{ width: "32px", verticalAlign: "top" }}>
              <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto" }}>
                <tr>
                  <td
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      backgroundColor: dotColor,
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontFamily: FONT_STACK,
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: done ? colors.white : colors.muted,
                      lineHeight: 1,
                    }}
                  >
                    {done ? "✓" : "•"}
                  </td>
                </tr>
                {!isLast && (
                  <tr>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          width: "2px",
                          height: "26px",
                          backgroundColor: done ? colors.green : colors.border,
                          margin: "3px auto",
                        }}
                      />
                    </td>
                  </tr>
                )}
              </table>
            </Column>
            <Column style={{ verticalAlign: "top", paddingLeft: "14px", paddingBottom: isLast ? 0 : "18px" }}>
              <Text
                style={{
                  ...textStyle,
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: done ? colors.black : colors.muted,
                  margin: 0,
                }}
              >
                {step.title}
              </Text>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", margin: "3px 0 0", lineHeight: "1.55" }}>
                {step.desc}
              </Text>
            </Column>
          </Row>
        )
      })}
    </>
  )
}

export function OrderShippedTemplate({
  customerName,
  customerEmail,
  displayId,
  currencyCode,
  shippingMethodLabel,
  carrierName,
  trackingNumber,
  trackingUrl,
  shippedAt,
  estimatedDeliveryLabel,
  addressLines,
  phone,
  items,
  fulfillmentType,
  currentStage = "international_transit",
}: OrderShippedProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>{DARK_MODE_OVERRIDE_STYLE}</style>
      </Head>
      <Preview>Your MUSE NZ order #{displayId} has been shipped.</Preview>
      <Body className="em-bg-page" style={{ backgroundColor: colors.creamDeep, margin: 0, padding: 0, colorScheme: "light" }}>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" bgcolor={colors.creamDeep} className="em-bg-page" style={{ backgroundColor: colors.creamDeep }}>
          <tr>
            <td>
              <Section className="em-bg-dark" style={{ backgroundColor: colors.black, padding: "26px 0", textAlign: "center" }} bgcolor={colors.black}>
                <Img src={logoUrl} width="150" alt="MUSE NZ" style={{ margin: "0 auto" }} />
              </Section>

              <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "44px 18px 36px" }}>
                <Section style={{ textAlign: "center", padding: "0 0 34px" }}>
                  <Text style={{ ...textStyle, color: colors.green, fontSize: "11.5px", fontWeight: "bold", letterSpacing: "0.12em", margin: "0 0 18px" }}>
                    ORDER SHIPPED
                  </Text>
                  <Heading style={{ ...textStyle, fontSize: "36px", lineHeight: "1.15", letterSpacing: "-0.02em", margin: "0 0 18px" }}>
                    Your order has been shipped.
                  </Heading>
                  <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto 18px" }}>
                    <tr>
                      <td
                        {...bgcolor(colors.black)}
                        style={{
                          backgroundColor: colors.black,
                          borderRadius: "999px",
                          padding: "10px 22px",
                          fontFamily: FONT_STACK,
                          fontSize: "15px",
                          fontWeight: "bold",
                          color: colors.white,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ color: colors.yellow }}>{trackingNumber}</span>
                        <span style={{ color: colors.white, paddingLeft: "10px" }}>⧉</span>
                      </td>
                    </tr>
                  </table>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "15px", lineHeight: "1.6", margin: "0 auto 22px", maxWidth: "410px" }}>
                    Thanks {customerName} — your order has shipped. Use the tracking number below to follow it from here.
                  </Text>
                  <a href={trackingUrl} style={{ textDecoration: "none" }}>
                    <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto" }}>
                      <tr>
                        <td
                          {...bgcolor(colors.black)}
                          style={{
                            backgroundColor: colors.black,
                            borderRadius: "999px",
                            padding: "14px 26px",
                            fontFamily: FONT_STACK,
                            fontSize: "13px",
                            fontWeight: "bold",
                            letterSpacing: "0.08em",
                            color: colors.white,
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Track order
                        </td>
                      </tr>
                    </table>
                  </a>
                </Section>

                <Section style={cardStyle} bgcolor={colors.white} className="em-bg-card">
                  <Text style={cardTitleStyle}>TRACKING DETAILS</Text>
                  <Row style={{ ...softCardStyle }} bgcolor={colors.creamDeep} className="em-bg-soft">
                    <Column style={{ width: "58px", verticalAlign: "middle" }}>
                      <IconSquare src={icons.track} alt="Tracking" />
                    </Column>
                    <Column style={{ paddingLeft: "14px", verticalAlign: "middle" }}>
                      <Text style={{ ...textStyle, fontSize: "13px", fontWeight: "bold", margin: 0 }}>International courier</Text>
                      <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", margin: "2px 0 0" }}>
                        Tracking #{trackingNumber}
                      </Text>
                    </Column>
                  </Row>

                  <Section style={{ marginTop: "20px" }}>
                    <Row>
                      <Column>
                        <Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", margin: "7px 0" }}>Status</Text>
                      </Column>
                      <Column style={{ textAlign: "right" }}>
                        <Text style={{ ...textStyle, color: colors.green, fontSize: "13.5px", fontWeight: "bold", margin: "7px 0" }}>Shipped</Text>
                      </Column>
                    </Row>
                    <Row>
                      <Column>
                        <Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", margin: "7px 0" }}>Tracking number</Text>
                      </Column>
                      <Column style={{ textAlign: "right" }}>
                        <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", margin: "7px 0" }}>{trackingNumber} ⧉</Text>
                      </Column>
                    </Row>
                    <Row>
                      <Column>
                        <Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", margin: "7px 0" }}>Delivery method</Text>
                      </Column>
                      <Column style={{ textAlign: "right" }}>
                        <Text style={{ ...textStyle, fontSize: "13.5px", margin: "7px 0" }}>{shippingMethodLabel}</Text>
                      </Column>
                    </Row>
                  </Section>
                </Section>

                <Section style={cardStyle} bgcolor={colors.white} className="em-bg-card">
                  <Text style={cardTitleStyle}>ORDER SUMMARY</Text>
                  {items.map((item, index) => (
                    <Section key={item.id} style={{ ...softCardStyle, marginTop: index ? "10px" : 0 }} bgcolor={colors.creamDeep} className="em-bg-soft">
                      <Row>
                        <Column style={{ width: "80px", verticalAlign: "middle" }}>
                          {item.thumbnail ? (
                            <Img src={item.thumbnail} alt={item.title} width="72" height="72" style={{ borderRadius: "12px", objectFit: "cover" }} />
                          ) : (
                            <table cellPadding="0" cellSpacing="0" role="presentation">
                              <tr>
                                <td {...bgcolor(colors.white)} style={{ width: "72px", height: "72px", borderRadius: "12px", backgroundColor: colors.white }} />
                              </tr>
                            </table>
                          )}
                        </Column>
                        <Column style={{ paddingLeft: "14px", verticalAlign: "middle" }}>
                          <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", margin: 0 }}>{item.title}</Text>
                          <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", margin: "4px 0 8px" }}>
                            {item.variantTitle ? `${item.variantTitle} · ` : ""}Qty {item.quantity}
                          </Text>
                          <table cellPadding="0" cellSpacing="0" role="presentation">
                            <tr>
                              <td
                                {...bgcolor(colors.blueSoft)}
                                style={{
                                  fontFamily: FONT_STACK,
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                  letterSpacing: "0.04em",
                                  color: colors.blue,
                                  backgroundColor: colors.blueSoft,
                                  borderRadius: "999px",
                                  padding: "4px 11px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {shippingMethodLabel.toUpperCase()}
                              </td>
                            </tr>
                          </table>
                        </Column>
                        <Column style={{ width: "84px", textAlign: "right", verticalAlign: "middle" }}>
                          <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", margin: 0 }}>
                            {new Intl.NumberFormat("en-NZ", {
                              style: "currency",
                              currency: currencyCode.toUpperCase(),
                              currencyDisplay: "narrowSymbol",
                            }).format(item.unitPrice * item.quantity)}
                          </Text>
                        </Column>
                      </Row>
                    </Section>
                  ))}
                </Section>

                <Section style={cardStyle} bgcolor={colors.white} className="em-bg-card">
                  <Text style={cardTitleStyle}>DELIVERING TO</Text>
                  <AddressLines lines={addressLines} phone={phone} />
                </Section>

                <Section style={cardStyle} bgcolor={colors.white} className="em-bg-card">
                  <Text style={cardTitleStyle}>WHAT HAPPENS NEXT</Text>
                  <Timeline type={fulfillmentType} currentStage={currentStage} />
                </Section>

                <Section style={{ ...cardStyle, marginTop: "22px" }}>
                  <Text style={cardTitleStyle}>NEED HELP WITH YOUR ORDER?</Text>
                  <a href={trackingUrl} style={{ textDecoration: "none" }}>
                    <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "12px", marginBottom: "10px" }} bgcolor={colors.creamDeep} className="em-bg-soft">
                      <Column style={{ width: "58px", padding: "13px 0 13px 14px", verticalAlign: "middle" }}>
                        <IconSquare src={icons.track} alt="Track order" />
                      </Column>
                      <Column style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                        <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", color: colors.black, margin: 0 }}>Track order →</Text>
                        <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", margin: "2px 0 0" }}>Opens with your tracking number already loaded</Text>
                      </Column>
                    </Row>
                  </a>
                  <a href="mailto:support@musenz.com" style={{ textDecoration: "none" }}>
                    <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "12px" }} bgcolor={colors.creamDeep} className="em-bg-soft">
                      <Column style={{ width: "58px", padding: "13px 0 13px 14px", verticalAlign: "middle" }}>
                        <IconSquare src={icons.chat} alt="Contact support" />
                      </Column>
                      <Column style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                        <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", color: colors.black, margin: 0 }}>Contact support →</Text>
                        <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", margin: "2px 0 0" }}>Reply here if tracking does not update</Text>
                      </Column>
                    </Row>
                  </a>
                </Section>

                <Section style={{ ...cardStyle, padding: "30px 24px", textAlign: "center" }}>
                  <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", color: colors.black, margin: "0 0 7px" }}>Thanks for backing MUSE.</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", lineHeight: "1.65", margin: 0 }}>
                    Sourced, inspected, and shipped to NZ — backed by our 30-day money-back guarantee.
                  </Text>
                </Section>

                <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", textAlign: "center", margin: "6px 0 0" }}>
                  Shipping update sent to {customerEmail}
                </Text>
              </Container>

              <Section style={{ backgroundColor: colors.black, padding: "40px 18px 30px", marginTop: "22px" }} bgcolor={colors.black} className="em-bg-dark">
                <Container style={{ maxWidth: "480px", margin: "0 auto" }}>
                  <Section style={{ textAlign: "center", marginBottom: "20px" }}>
                    <Img src={logoUrl} width="120" alt="MUSE NZ" style={{ margin: "0 auto" }} />
                  </Section>
                  <Text style={{ ...textStyle, fontSize: "12.5px", color: "#999999", lineHeight: "1.65", textAlign: "center", margin: "0 auto 24px", maxWidth: "320px" }}>
                    An online store for footwear, apparel, and everyday essentials. Shop current products with tracked delivery, and local support.
                  </Text>
                  <Section style={{ textAlign: "center", marginBottom: "24px" }}>
                    <SocialIcon href="https://instagram.com/muse.nz" src={icons.instagram} alt="Instagram" />
                    <SocialIcon href="https://facebook.com/muse.nz" src={icons.facebook} alt="Facebook" />
                  </Section>
                  <Text style={{ textAlign: "center", fontSize: "11.5px", color: "#999999", margin: "0 0 20px" }}>
                    <a href="https://musenz.com/faq" style={{ color: "#999999", marginRight: "16px" }}>FAQ</a>
                    <a href={trackingUrl} style={{ color: "#999999", marginRight: "16px" }}>Track Order</a>
                    <a href="https://musenz.com/returns" style={{ color: "#999999", marginRight: "16px" }}>Returns</a>
                    <a href="mailto:support@musenz.com" style={{ color: "#999999" }}>Contact Us</a>
                  </Text>
                  <Text style={{ textAlign: "center", fontSize: "11px", color: "#555555", margin: 0 }}>
                    © {new Date().getFullYear()} MUSE NZ. All rights reserved.
                  </Text>
                </Container>
              </Section>
            </td>
          </tr>
        </table>
      </Body>
    </Html>
  )
}
