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
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", margin: "3px 0 0" }}>
                    {item.variantTitle ? `${item.variantTitle} · ` : ""}Qty {item.quantity}
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
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", lineHeight: "1.6", margin: "20px 0 0" }}>Questions? Reply to this email or contact support@musenz.com.</Text>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "11px", margin: "10px 0 0" }}>Confirmation sent to {customerEmail}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
