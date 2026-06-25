import {
  Body,
  Button,
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
import { colors, FONT_STACK, formatEta, formatMoney, FulfillmentType, logoUrl } from "./theme"

export type EmailItem = {
  id: string
  title: string
  variantTitle?: string | null
  quantity: number
  unitPrice: number
  thumbnail?: string | null
  fulfillmentType: FulfillmentType
}

export type Shipment = {
  type: FulfillmentType
  label?: string
  items: EmailItem[]
}

export type OrderConfirmationProps = {
  customerName: string
  customerEmail: string
  displayId: string
  createdAt: string
  currencyCode: string
  subtotal: number
  shippingTotal: number
  discountTotal: number
  taxTotal: number
  total: number
  address: string
  shipments: Shipment[]
  trackingUrl: string
}

const textStyle = {
  fontFamily: FONT_STACK,
  color: colors.text,
}

const cardStyle = {
  backgroundColor: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: "14px",
  padding: "20px",
  marginBottom: "14px",
}

const cardTitleStyle = {
  ...textStyle,
  fontSize: "12px",
  fontWeight: "bold" as const,
  letterSpacing: "0.08em",
  margin: "0 0 16px",
}

/** Each step: a 4-stage timeline for NZ Stock, 6-stage for Standard Delivery. */
const TIMELINE_STEPS: Record<FulfillmentType, { title: string; desc: string }[]> = {
  nzstock: [
    { title: "Order confirmed", desc: "Your payment went through and your order is locked in." },
    { title: "Packed in Auckland", desc: "Quality-checked and packed by our team." },
    { title: "Shipped", desc: "Tracking number sent by email once it leaves our workspace." },
    { title: "Delivered", desc: "Tag @muse.nz when you wear it — 10% off your next order." },
  ],
  standard: [
    { title: "Order confirmed", desc: "Your payment went through and your order is locked in." },
    { title: "Being prepped", desc: "Quality-checked and packed by our team." },
    { title: "International transit", desc: "On its way from our overseas warehouse." },
    { title: "Arrived in New Zealand", desc: "Handed to NZ Post for final delivery." },
    { title: "Delivered", desc: "Tag @muse.nz when you wear it — 10% off your next order." },
  ],
}

/**
 * Gmail (and most webmail clients) strip inline <svg> out of email bodies
 * entirely during sanitization — that's a hard constraint of email HTML,
 * not something we can style around. It's the same reason the icons
 * rendered as empty colored shapes with nothing inside. Unicode characters
 * and emoji survive that sanitization fine, so every icon below is a glyph
 * sized up via fontSize rather than a vector path.
 */
function IconGlyph({ glyph, size = "14px" }: { glyph: string; size?: string }) {
  return <span style={{ fontFamily: FONT_STACK, fontSize: size, lineHeight: 1, color: colors.yellow }}>{glyph}</span>
}

/** Timeline: a vertical stack of circular step-dots connected by a thin rail, label + description beside each. */
function Timeline({ type }: { type: FulfillmentType }) {
  const steps = TIMELINE_STEPS[type]
  return (
    <>
      {steps.map((step, index) => {
        const done = index === 0
        const isLast = index === steps.length - 1
        const dotColor = done ? colors.green : colors.creamDeep
        return (
          <Row key={step.title}>
            <Column style={{ width: "30px", verticalAlign: "top" }}>
              <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto" }}>
                <tr>
                  <td
                    style={{
                      width: "24px",
                      height: "24px",
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
                      <div style={{ width: "2px", height: "22px", backgroundColor: done ? colors.green : colors.border, margin: "2px auto" }} />
                    </td>
                  </tr>
                )}
              </table>
            </Column>
            <Column style={{ verticalAlign: "top", paddingLeft: "12px", paddingBottom: isLast ? 0 : "16px" }}>
              <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", color: done ? colors.black : colors.muted, margin: 0 }}>
                {step.title}
              </Text>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", margin: "3px 0 0", lineHeight: "1.5" }}>
                {step.desc}
              </Text>
            </Column>
          </Row>
        )
      })}
    </>
  )
}

function IconSquare({ children }: { children: React.ReactNode }) {
  return (
    <table cellPadding="0" cellSpacing="0" role="presentation">
      <tr>
        <td style={{ width: "32px", height: "32px", borderRadius: "9px", backgroundColor: colors.black, textAlign: "center", verticalAlign: "middle" }}>
          {children}
        </td>
      </tr>
    </table>
  )
}

function SocialIcon({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} style={{ textDecoration: "none" }}>
      <table cellPadding="0" cellSpacing="0" role="presentation" style={{ display: "inline-table", marginRight: "10px" }}>
        <tr>
          <td
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.08)",
              textAlign: "center",
              verticalAlign: "middle",
              fontFamily: FONT_STACK,
              fontSize: "10px",
              fontWeight: "bold",
              letterSpacing: "0.03em",
              color: colors.cream,
            }}
          >
            {label}
          </td>
        </tr>
      </table>
    </a>
  )
}

export function OrderConfirmationTemplate({
  customerName,
  customerEmail,
  displayId,
  createdAt,
  currencyCode,
  subtotal,
  shippingTotal,
  discountTotal,
  taxTotal,
  total,
  address,
  shipments,
  trackingUrl,
}: OrderConfirmationProps) {
  const mixed = shipments.length > 1
  const items = shipments.flatMap((shipment) => shipment.items)

  return (
    <Html lang="en">
      <Head />
      <Preview>Your MUSE NZ order #{displayId} is locked in.</Preview>
      <Body style={{ backgroundColor: colors.creamDeep, margin: 0, padding: 0 }}>
        <Section style={{ backgroundColor: colors.black, padding: "22px 0", textAlign: "center" }}>
          <Img src={logoUrl} width="140" alt="MUSE NZ" style={{ margin: "0 auto" }} />
        </Section>
        <Container style={{ maxWidth: "520px", margin: "0 auto", padding: "28px 16px" }}>
          <Section style={{ textAlign: "center", padding: "8px 0 22px" }}>
            <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto 14px" }}>
              <tr>
                <td
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: colors.green,
                    textAlign: "center",
                    verticalAlign: "middle",
                    fontFamily: FONT_STACK,
                    fontSize: "26px",
                    fontWeight: "bold",
                    color: colors.white,
                    lineHeight: 1,
                  }}
                >
                  ✓
                </td>
              </tr>
            </table>
            <Heading style={{ ...textStyle, fontSize: "28px", margin: "0 0 8px" }}>Your order is locked in.</Heading>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "14px", margin: 0 }}>
              Thanks {customerName}. We have received order #{displayId}.
            </Text>
          </Section>

          {/* ============== ORDER SUMMARY ============== */}
          <Section style={cardStyle}>
            <Text style={cardTitleStyle}>ORDER SUMMARY</Text>
            {items.map((item) => (
              <Row key={item.id} style={{ borderTop: `1px solid ${colors.border}`, padding: "12px 0" }}>
                <Column style={{ width: "62px", verticalAlign: "top" }}>
                  {item.thumbnail ? (
                    <Img src={item.thumbnail} alt={item.title} width="54" height="54" style={{ borderRadius: "10px", objectFit: "cover" }} />
                  ) : (
                    <table cellPadding="0" cellSpacing="0" role="presentation">
                      <tr><td style={{ width: "54px", height: "54px", borderRadius: "10px", backgroundColor: colors.creamDeep }} /></tr>
                    </table>
                  )}
                </Column>
                <Column style={{ paddingLeft: "12px", verticalAlign: "top" }}>
                  <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", margin: 0 }}>{item.title}</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", margin: "3px 0 6px" }}>
                    {item.variantTitle ? `${item.variantTitle} · ` : ""}Qty {item.quantity}
                  </Text>
                  <table cellPadding="0" cellSpacing="0" role="presentation">
                    <tr>
                      <td
                        style={{
                          fontFamily: FONT_STACK,
                          fontSize: "10px",
                          fontWeight: "bold",
                          letterSpacing: "0.03em",
                          color: item.fulfillmentType === "nzstock" ? colors.green : colors.blue,
                          backgroundColor: item.fulfillmentType === "nzstock" ? colors.greenSoft : colors.blueSoft,
                          borderRadius: "999px",
                          padding: "4px 10px",
                        }}
                      >
                        {item.fulfillmentType === "nzstock" ? "NZ STOCK" : "STANDARD DELIVERY"}
                      </td>
                    </tr>
                  </table>
                </Column>
                <Column style={{ width: "84px", textAlign: "right", verticalAlign: "top" }}>
                  <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", margin: 0 }}>{formatMoney(item.unitPrice * item.quantity, currencyCode)}</Text>
                </Column>
              </Row>
            ))}
            <Row><Column><Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", margin: "8px 0" }}>Subtotal</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "13px", margin: "8px 0" }}>{formatMoney(subtotal, currencyCode)}</Text></Column></Row>
            <Row><Column><Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", margin: "8px 0" }}>Shipping</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "13px", margin: "8px 0" }}>{shippingTotal ? formatMoney(shippingTotal, currencyCode) : "Free"}</Text></Column></Row>
            {discountTotal > 0 ? <Row><Column><Text style={{ ...textStyle, color: colors.green, fontSize: "13px", margin: "8px 0" }}>Discount</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, color: colors.green, fontSize: "13px", margin: "8px 0" }}>−{formatMoney(discountTotal, currencyCode)}</Text></Column></Row> : null}
            <Row><Column><Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", margin: "8px 0" }}>GST included</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "13px", margin: "8px 0" }}>{formatMoney(taxTotal, currencyCode)}</Text></Column></Row>
            <Row style={{ borderTop: `2px solid ${colors.black}` }}><Column><Text style={{ ...textStyle, fontSize: "16px", fontWeight: "bold", margin: "14px 0 0" }}>Total paid</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "16px", fontWeight: "bold", margin: "14px 0 0" }}>{formatMoney(total, currencyCode)}</Text></Column></Row>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", margin: "14px 0 0" }}>Paid securely by Stripe</Text>
          </Section>

          {/* ============== DELIVERY DETAILS ============== */}
          <Section style={cardStyle}>
            <Text style={cardTitleStyle}>DELIVERING TO</Text>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", lineHeight: "1.6", margin: "0 0 18px", whiteSpace: "pre-line" }}>{address}</Text>
            {shipments.map((shipment, index) => (
              <Section
                key={`${shipment.type}-${index}`}
                style={{
                  backgroundColor: colors.creamDeep,
                  border: `1px solid ${colors.creamDeep}`,
                  borderRadius: "12px",
                  padding: "14px",
                  marginTop: index ? "10px" : 0,
                }}
              >
                <Row>
                  <Column style={{ width: "40px", verticalAlign: "top" }}>
                    <IconSquare><IconGlyph glyph="📅" /></IconSquare>
                  </Column>
                  <Column style={{ verticalAlign: "top", paddingLeft: "10px" }}>
                    {mixed ? <Text style={{ ...textStyle, color: colors.muted, fontSize: "10.5px", fontWeight: "bold", letterSpacing: "0.04em", margin: "0 0 4px" }}>{(shipment.label || `Shipment ${index + 1} of ${shipments.length}`).toUpperCase()}</Text> : null}
                    <Text style={{ ...textStyle, fontSize: "13px", fontWeight: "bold", margin: 0 }}>{shipment.type === "nzstock" ? "NZ Stock" : "Standard Delivery"}</Text>
                    <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", color: colors.black, margin: "4px 0 0" }}>{formatEta(createdAt, shipment.type)}</Text>
                  </Column>
                </Row>
              </Section>
            ))}
          </Section>

          {/* ============== WHAT HAPPENS NEXT ============== */}
          {shipments.map((shipment, index) => (
            <Section key={`timeline-${shipment.type}-${index}`} style={cardStyle}>
              <Text style={cardTitleStyle}>
                WHAT HAPPENS NEXT{mixed ? ` — ${(shipment.label || `Shipment ${index + 1}`).toUpperCase()}` : ""}
              </Text>
              <Timeline type={shipment.type} />
            </Section>
          ))}

          <Section style={{ textAlign: "center", padding: "10px 0 4px" }}>
            <Button href={trackingUrl} style={{ backgroundColor: colors.yellow, borderRadius: "999px", color: colors.black, fontFamily: FONT_STACK, fontSize: "13px", fontWeight: "bold", padding: "13px 22px", textDecoration: "none" }}>TRACK YOUR ORDER</Button>
          </Section>

          {/* ============== NEED HELP ============== */}
          <Section style={{ ...cardStyle, marginTop: "18px" }}>
            <Text style={cardTitleStyle}>NEED HELP WITH YOUR ORDER?</Text>

            <a href={trackingUrl} style={{ textDecoration: "none" }}>
              <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "10px", marginBottom: "9px" }}>
                <Column style={{ width: "54px", padding: "12px 0 12px 14px", verticalAlign: "middle" }}>
                  <IconSquare><IconGlyph glyph="📦" /></IconSquare>
                </Column>
                <Column style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                  <Text style={{ ...textStyle, fontSize: "13px", fontWeight: "bold", color: colors.black, margin: 0 }}>Track order →</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "11px", margin: "2px 0 0" }}>View shipping status</Text>
                </Column>
              </Row>
            </a>
            <a href="mailto:support@musenz.com" style={{ textDecoration: "none" }}>
              <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "10px", marginBottom: "14px" }}>
                <Column style={{ width: "54px", padding: "12px 0 12px 14px", verticalAlign: "middle" }}>
                  <IconSquare><IconGlyph glyph="💬" /></IconSquare>
                </Column>
                <Column style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                  <Text style={{ ...textStyle, fontSize: "13px", fontWeight: "bold", color: colors.black, margin: 0 }}>Contact support →</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "11px", margin: "2px 0 0" }}>We respond within 24h</Text>
                </Column>
              </Row>
            </a>

            <Section style={{ backgroundColor: colors.creamDeep, borderRadius: "10px", padding: "12px 14px" }}>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", lineHeight: "1.6", margin: 0 }}>
                <strong style={{ color: colors.black }}>30-day returns.</strong> Unworn, tags intact, full refund.{" "}
                <a href="https://store.musenz.com/returns" style={{ color: colors.text, fontWeight: "bold" }}>Start a return</a>
              </Text>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", lineHeight: "1.6", margin: "12px 0 0", paddingTop: "12px", borderTop: `1px solid ${colors.border}` }}>
                <strong style={{ color: colors.black }}>Need to cancel or change your order?</strong> Email{" "}
                <a href="mailto:support@musenz.com" style={{ color: colors.text, fontWeight: "bold" }}>support@musenz.com</a>{" "}
                as soon as possible — we can usually amend or cancel orders that haven't been packed yet.
              </Text>
            </Section>
          </Section>

          {/* ============== THANK YOU ============== */}
          <Section style={{ ...cardStyle, padding: "24px 20px", textAlign: "center" }}>
            <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", color: colors.black, margin: "0 0 6px" }}>Thanks for backing MUSE.</Text>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", lineHeight: "1.6", margin: 0 }}>
              Sourced, inspected, and shipped to NZ — backed by our 30-day money-back guarantee.
            </Text>
          </Section>

          <Text style={{ ...textStyle, color: colors.muted, fontSize: "11px", textAlign: "center", margin: "4px 0 0" }}>Confirmation sent to {customerEmail}</Text>
        </Container>

        {/* ============== FOOTER ============== */}
        <Section style={{ backgroundColor: colors.black, padding: "32px 18px 26px", marginTop: "20px" }}>
          <Container style={{ maxWidth: "480px", margin: "0 auto" }}>
            <Section style={{ textAlign: "center", marginBottom: "16px" }}>
              <Img src={logoUrl} width="110" alt="MUSE NZ" style={{ margin: "0 auto" }} />
            </Section>
            <Text style={{ ...textStyle, fontSize: "12px", color: "#999999", lineHeight: "1.6", textAlign: "center", margin: "0 auto 20px", maxWidth: "320px" }}>
              An online store for footwear, apparel, and everyday essentials. Shop current products with tracked delivery, and local support.
            </Text>

            <Section style={{ textAlign: "center", marginBottom: "20px" }}>
              <SocialIcon href="https://instagram.com/muse.nz" label="IG" />
              <SocialIcon href="https://facebook.com/muse.nz" label="FB" />
              <SocialIcon href="https://tiktok.com/@muse.nz" label="TT" />
            </Section>

            <Text style={{ textAlign: "center", fontSize: "11.5px", color: "#999999", margin: "0 0 18px" }}>
              <a href="https://store.musenz.com/faq" style={{ color: "#999999", marginRight: "14px" }}>FAQ</a>
              <a href={trackingUrl} style={{ color: "#999999", marginRight: "14px" }}>Track Order</a>
              <a href="https://store.musenz.com/returns" style={{ color: "#999999", marginRight: "14px" }}>Returns</a>
              <a href="mailto:support@musenz.com" style={{ color: "#999999" }}>Contact Us</a>
            </Text>
            <Text style={{ textAlign: "center", fontSize: "11px", color: "#555555", margin: 0 }}>
              © {new Date(createdAt).getFullYear()} MUSE NZ. All rights reserved.
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  )
}
