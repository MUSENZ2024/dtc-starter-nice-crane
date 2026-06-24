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
import { colors, formatEta, formatMoney, FulfillmentType, logoUrl } from "./theme"

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
  fontFamily: "Arial, Helvetica, sans-serif",
  color: colors.text,
}

const timeline = (type: FulfillmentType) =>
  type === "nzstock"
    ? ["Order confirmed", "Packed in Auckland", "Delivered"]
    : [
        "Order confirmed",
        "Being prepped",
        "International transit",
        "Arrived in New Zealand",
        "Delivered",
      ]

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
            <Text style={{ ...textStyle, color: colors.green, fontSize: "24px", fontWeight: "bold", margin: 0 }}>✓</Text>
            <Heading style={{ ...textStyle, fontSize: "28px", margin: "8px 0" }}>Your order is locked in.</Heading>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "14px", margin: 0 }}>
              Thanks {customerName}. We have received order #{displayId}.
            </Text>
          </Section>

          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "20px", marginBottom: "14px" }}>
            <Text style={{ ...textStyle, fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", margin: "0 0 16px" }}>ORDER SUMMARY</Text>
            {items.map((item) => (
              <Row key={item.id} style={{ borderTop: `1px solid ${colors.border}`, padding: "12px 0" }}>
                <Column style={{ width: "62px" }}>
                  {item.thumbnail ? <Img src={item.thumbnail} alt={item.title} width="54" height="54" style={{ borderRadius: "8px", objectFit: "cover" }} /> : null}
                </Column>
                <Column style={{ paddingLeft: "10px" }}>
                  <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", margin: 0 }}>{item.title}</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", margin: "3px 0 5px" }}>
                    {item.variantTitle ? `${item.variantTitle} · ` : ""}Qty {item.quantity}
                  </Text>
                  <Text
                    style={{
                      display: "inline-block",
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: "10px",
                      fontWeight: "bold",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      color: item.fulfillmentType === "nzstock" ? colors.green : colors.blue,
                      backgroundColor: item.fulfillmentType === "nzstock" ? colors.greenSoft : colors.blueSoft,
                      borderRadius: "999px",
                      padding: "3px 9px",
                      margin: 0,
                    }}
                  >
                    {item.fulfillmentType === "nzstock" ? "NZ Stock" : "Standard Delivery"}
                  </Text>
                </Column>
                <Column style={{ width: "84px", textAlign: "right" }}>
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

          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "20px", marginBottom: "14px" }}>
            <Text style={{ ...textStyle, fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", margin: "0 0 8px" }}>DELIVERING TO</Text>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", lineHeight: "1.6", margin: "0 0 18px" }}>{address}</Text>
            {shipments.map((shipment, index) => (
              <Section key={`${shipment.type}-${index}`} style={{ backgroundColor: shipment.type === "nzstock" ? colors.greenSoft : colors.blueSoft, borderRadius: "10px", padding: "14px", marginTop: index ? "10px" : 0 }}>
                {mixed ? <Text style={{ ...textStyle, color: colors.muted, fontSize: "11px", fontWeight: "bold", margin: "0 0 5px" }}>{shipment.label || `Shipment ${index + 1} of ${shipments.length}`}</Text> : null}
                <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", margin: 0 }}>{shipment.type === "nzstock" ? "NZ Stock" : "Standard Delivery"}</Text>
                <Text style={{ ...textStyle, fontSize: "14px", margin: "5px 0 0" }}>Estimated delivery: {formatEta(createdAt, shipment.type)}</Text>
              </Section>
            ))}
          </Section>

          {shipments.map((shipment, index) => (
            <Section key={`timeline-${shipment.type}-${index}`} style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "20px", marginBottom: "14px" }}>
              <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", margin: "0 0 12px" }}>What happens next{mixed ? ` — ${shipment.label || `Shipment ${index + 1}`}` : ""}</Text>
              {timeline(shipment.type).map((step, stepIndex) => <Text key={step} style={{ ...textStyle, color: stepIndex === 0 ? colors.green : colors.muted, fontSize: "13px", margin: "9px 0" }}>{stepIndex === 0 ? "●" : "○"} {step}</Text>)}
            </Section>
          ))}

          <Section style={{ textAlign: "center", padding: "10px 0 4px" }}>
            <Button href={trackingUrl} style={{ backgroundColor: colors.yellow, borderRadius: "999px", color: colors.black, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontWeight: "bold", padding: "13px 22px", textDecoration: "none" }}>TRACK YOUR ORDER</Button>
          </Section>

          {/* ============== NEED HELP ============== */}
          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "20px", marginTop: "18px", marginBottom: "14px" }}>
            <Text style={{ ...textStyle, fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", margin: "0 0 14px" }}>NEED HELP WITH YOUR ORDER?</Text>

            <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "10px", marginBottom: "9px" }}>
              <Column style={{ padding: "12px 14px" }}>
                <a href={trackingUrl} style={{ textDecoration: "none" }}>
                  <Text style={{ ...textStyle, fontSize: "13px", fontWeight: "bold", color: colors.black, margin: 0 }}>Track order →</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "11px", margin: "2px 0 0" }}>View shipping status</Text>
                </a>
              </Column>
            </Row>
            <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "10px", marginBottom: "14px" }}>
              <Column style={{ padding: "12px 14px" }}>
                <a href="mailto:support@musenz.com" style={{ textDecoration: "none" }}>
                  <Text style={{ ...textStyle, fontSize: "13px", fontWeight: "bold", color: colors.black, margin: 0 }}>Contact support →</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "11px", margin: "2px 0 0" }}>We respond within 24h</Text>
                </a>
              </Column>
            </Row>

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
          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "24px 20px", textAlign: "center", marginBottom: "14px" }}>
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

            <Row style={{ marginBottom: "20px" }}>
              <Column style={{ textAlign: "center" }}>
                <a href="https://instagram.com/muse.nz" style={{ display: "inline-block", width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)", textAlign: "center", lineHeight: "38px", marginRight: "10px" }}>
                  <Text style={{ fontSize: "16px", margin: 0, color: colors.cream }}>IG</Text>
                </a>
                <a href="https://facebook.com/muse.nz" style={{ display: "inline-block", width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)", textAlign: "center", lineHeight: "38px", marginRight: "10px" }}>
                  <Text style={{ fontSize: "16px", margin: 0, color: colors.cream }}>FB</Text>
                </a>
                <a href="https://tiktok.com/@muse.nz" style={{ display: "inline-block", width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)", textAlign: "center", lineHeight: "38px" }}>
                  <Text style={{ fontSize: "16px", margin: 0, color: colors.cream }}>TT</Text>
                </a>
              </Column>
            </Row>

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
