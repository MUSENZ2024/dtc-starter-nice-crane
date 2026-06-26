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
import { bgcolor, colors, DARK_MODE_OVERRIDE_STYLE, FONT_STACK, formatEta, formatMoney, FulfillmentType, icons, logoUrl } from "./theme"

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
  shippingProtectionAmount: number
  discountTotal: number
  taxTotal: number
  total: number
  addressLines: string[]
  phone?: string | null
  billingAddressLines?: string[] | null
  billingPhone?: string | null
  shipments: Shipment[]
  trackingUrl: string
  shippingMethodLabel: string
  paymentMethodLabel: string
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
                      <div style={{ width: "2px", height: "26px", backgroundColor: done ? colors.green : colors.border, margin: "3px auto" }} />
                    </td>
                  </tr>
                )}
              </table>
            </Column>
            <Column style={{ verticalAlign: "top", paddingLeft: "14px", paddingBottom: isLast ? 0 : "18px" }}>
              <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", color: done ? colors.black : colors.muted, margin: 0 }}>
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

/**
 * Each address component gets its own Text element instead of one block
 * joined with "\n" + white-space:pre-line — that single-blob approach
 * rendered as one continuous run with no line breaks at all in Gmail's
 * mobile app (its dark-mode sanitizer drops white-space:pre-line), so this
 * is the more robust, client-proof way to get reliable line breaks. Phone
 * gets its own visually separated line so it doesn't read as part of the
 * postal address.
 */
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
        <td {...bgcolor(colors.black)} style={{ width: "40px", height: "40px", borderRadius: "11px", backgroundColor: colors.black, textAlign: "center", verticalAlign: "middle" }}>
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

export function OrderConfirmationTemplate({
  customerName,
  customerEmail,
  displayId,
  createdAt,
  currencyCode,
  subtotal,
  shippingTotal,
  shippingProtectionAmount,
  discountTotal,
  taxTotal,
  total,
  addressLines,
  phone,
  billingAddressLines,
  billingPhone,
  shipments,
  trackingUrl,
  shippingMethodLabel,
  paymentMethodLabel,
}: OrderConfirmationProps) {
  const mixed = shipments.length > 1
  const items = shipments.flatMap((shipment) => shipment.items)

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{DARK_MODE_OVERRIDE_STYLE}</style>
      </Head>
      <Preview>Your MUSE NZ order #{displayId} is locked in.</Preview>
      <Body className="em-bg-page" style={{ backgroundColor: colors.creamDeep, margin: 0, padding: 0 }}>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" bgcolor={colors.creamDeep} className="em-bg-page" style={{ backgroundColor: colors.creamDeep }}>
          <tr>
            <td>
        <Section className="em-bg-dark" style={{ backgroundColor: colors.black, padding: "26px 0", textAlign: "center" }} bgcolor={colors.black}>
          <Img src={logoUrl} width="150" alt="MUSE NZ" style={{ margin: "0 auto" }} />
        </Section>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "44px 18px 36px" }}>
          <Section style={{ textAlign: "center", padding: "0 0 36px" }}>
            <Text style={{ ...textStyle, color: colors.green, fontSize: "11.5px", fontWeight: "bold", letterSpacing: "0.12em", margin: "0 0 18px" }}>
              ORDER CONFIRMED
            </Text>
            <Heading style={{ ...textStyle, fontSize: "36px", lineHeight: "1.15", letterSpacing: "-0.02em", margin: "0 0 18px" }}>
              Your order is locked in.
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
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: colors.white,
                    whiteSpace: "nowrap",
                  }}
                >
                  Order <span style={{ color: colors.yellow }}>#{displayId}</span>
                </td>
              </tr>
            </table>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "15px", lineHeight: "1.6", margin: "0 auto", maxWidth: "400px" }}>
              Thanks {customerName} — we're prepping your order now and will email the moment it ships.
            </Text>
          </Section>

          {/* ============== ORDER SUMMARY ============== */}
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
                        <tr><td {...bgcolor(colors.white)} style={{ width: "72px", height: "72px", borderRadius: "12px", backgroundColor: colors.white }} /></tr>
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
                    <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", margin: 0 }}>{formatMoney(item.unitPrice * item.quantity, currencyCode)}</Text>
                  </Column>
                </Row>
              </Section>
            ))}

            <Section style={{ marginTop: "22px" }}>
              <Row><Column><Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", margin: "7px 0" }}>Subtotal</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "13.5px", margin: "7px 0" }}>{formatMoney(subtotal, currencyCode)}</Text></Column></Row>
              <Row><Column><Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", margin: "7px 0" }}>Shipping — {shippingMethodLabel}</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "13.5px", margin: "7px 0", color: shippingTotal ? colors.text : colors.green, fontWeight: shippingTotal ? "normal" : "bold" }}>{shippingTotal ? formatMoney(shippingTotal, currencyCode) : "Free"}</Text></Column></Row>
              {shippingProtectionAmount > 0 ? <Row><Column><Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", margin: "7px 0" }}>Shipping protection</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "13.5px", margin: "7px 0" }}>{formatMoney(shippingProtectionAmount, currencyCode)}</Text></Column></Row> : null}
              {discountTotal > 0 ? <Row><Column><Text style={{ ...textStyle, color: colors.green, fontSize: "13.5px", margin: "7px 0" }}>Discount</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, color: colors.green, fontSize: "13.5px", margin: "7px 0" }}>−{formatMoney(discountTotal, currencyCode)}</Text></Column></Row> : null}
              <Row><Column><Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", margin: "7px 0" }}>GST included</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "13.5px", margin: "7px 0" }}>{formatMoney(taxTotal, currencyCode)}</Text></Column></Row>
              <Row style={{ borderTop: `2px solid ${colors.black}` }}><Column><Text style={{ ...textStyle, fontSize: "17px", fontWeight: "bold", margin: "16px 0 0" }}>Total paid</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "17px", fontWeight: "bold", margin: "16px 0 0" }}>{formatMoney(total, currencyCode)}</Text></Column></Row>
            </Section>

            <Row style={{ ...softCardStyle, marginTop: "18px" }} bgcolor={colors.creamDeep} className="em-bg-soft">
              <Column style={{ width: "58px", verticalAlign: "middle" }}>
                <IconSquare src={icons.card} alt="Payment method" />
              </Column>
              <Column style={{ paddingLeft: "14px", verticalAlign: "middle" }}>
                <Text style={{ ...textStyle, fontSize: "13px", fontWeight: "bold", margin: 0 }}>Paid with {paymentMethodLabel}</Text>
                <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", margin: "2px 0 0" }}>Order #{displayId}</Text>
              </Column>
            </Row>
          </Section>

          {/* ============== DELIVERY DETAILS ============== */}
          <Section style={cardStyle} bgcolor={colors.white} className="em-bg-card">
            <Text style={cardTitleStyle}>DELIVERING TO</Text>
            <Section style={{ marginBottom: "20px" }}>
              <AddressLines lines={addressLines} phone={phone} />
            </Section>
            {shipments.map((shipment, index) => (
              <Section
                key={`${shipment.type}-${index}`}
                style={{
                  backgroundColor: colors.creamDeep,
                  borderRadius: "12px",
                  padding: "16px",
                  marginTop: index ? "10px" : 0,
                }}
                bgcolor={colors.creamDeep}
                className="em-bg-soft"
              >
                <Row>
                  <Column style={{ width: "56px", verticalAlign: "top" }}>
                    <IconSquare src={icons.calendar} alt="Estimated delivery" />
                  </Column>
                  <Column style={{ verticalAlign: "top", paddingLeft: "12px" }}>
                    {mixed ? <Text style={{ ...textStyle, color: colors.muted, fontSize: "10.5px", fontWeight: "bold", letterSpacing: "0.05em", margin: "0 0 5px" }}>{(shipment.label || `Shipment ${index + 1} of ${shipments.length}`).toUpperCase()}</Text> : null}
                    <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", margin: 0 }}>{shipment.type === "nzstock" ? "NZ Stock" : "International Stock"}</Text>
                    <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", color: colors.black, margin: "5px 0 0" }}>{formatEta(createdAt, shipment.type)}</Text>
                  </Column>
                </Row>
              </Section>
            ))}
            {billingAddressLines ? (
              <Section style={{ ...softCardStyle, marginTop: "10px" }} bgcolor={colors.creamDeep} className="em-bg-soft">
                <Text style={{ ...textStyle, color: colors.muted, fontSize: "10.5px", fontWeight: "bold", letterSpacing: "0.05em", margin: "0 0 8px" }}>BILLING ADDRESS</Text>
                <AddressLines lines={billingAddressLines} phone={billingPhone} />
              </Section>
            ) : null}
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

          {/* ============== NEED HELP ============== */}
          <Section style={{ ...cardStyle, marginTop: "22px" }}>
            <Text style={cardTitleStyle}>NEED HELP WITH YOUR ORDER?</Text>

            <a href={trackingUrl} style={{ textDecoration: "none" }}>
              <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "12px", marginBottom: "10px" }} bgcolor={colors.creamDeep} className="em-bg-soft">
                <Column style={{ width: "58px", padding: "13px 0 13px 14px", verticalAlign: "middle" }}>
                  <IconSquare src={icons.track} alt="Track order" />
                </Column>
                <Column style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                  <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", color: colors.black, margin: 0 }}>Track order →</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", margin: "2px 0 0" }}>View shipping status</Text>
                </Column>
              </Row>
            </a>
            <a href="mailto:support@musenz.com" style={{ textDecoration: "none" }}>
              <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "12px", marginBottom: "16px" }} bgcolor={colors.creamDeep} className="em-bg-soft">
                <Column style={{ width: "58px", padding: "13px 0 13px 14px", verticalAlign: "middle" }}>
                  <IconSquare src={icons.chat} alt="Contact support" />
                </Column>
                <Column style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                  <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", color: colors.black, margin: 0 }}>Contact support →</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", margin: "2px 0 0" }}>We respond within 24h</Text>
                </Column>
              </Row>
            </a>

            <Section style={{ backgroundColor: colors.creamDeep, borderRadius: "12px", padding: "14px 16px" }} bgcolor={colors.creamDeep} className="em-bg-soft">
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", lineHeight: "1.65", margin: 0 }}>
                <strong style={{ color: colors.black }}>30-day returns.</strong> Unworn, tags intact, full refund.{" "}
                <a href="https://store.musenz.com/returns" style={{ color: colors.text, fontWeight: "bold" }}>Start a return</a>
              </Text>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", lineHeight: "1.65", margin: "13px 0 0", paddingTop: "13px", borderTop: `1px solid ${colors.border}` }}>
                <strong style={{ color: colors.black }}>Need to cancel or change your order?</strong> Email{" "}
                <a href="mailto:support@musenz.com" style={{ color: colors.text, fontWeight: "bold" }}>support@musenz.com</a>{" "}
                as soon as possible — we can usually amend or cancel orders that haven't been packed yet.
              </Text>
            </Section>
          </Section>

          {/* ============== THANK YOU ============== */}
          <Section style={{ ...cardStyle, padding: "30px 24px", textAlign: "center" }}>
            <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", color: colors.black, margin: "0 0 7px" }}>Thanks for backing MUSE.</Text>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", lineHeight: "1.65", margin: 0 }}>
              Sourced, inspected, and shipped to NZ — backed by our 30-day money-back guarantee.
            </Text>
          </Section>

          <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", textAlign: "center", margin: "6px 0 0" }}>Confirmation sent to {customerEmail}</Text>
        </Container>

        {/* ============== FOOTER ============== */}
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
              <a href="https://store.musenz.com/faq" style={{ color: "#999999", marginRight: "16px" }}>FAQ</a>
              <a href={trackingUrl} style={{ color: "#999999", marginRight: "16px" }}>Track Order</a>
              <a href="https://store.musenz.com/returns" style={{ color: "#999999", marginRight: "16px" }}>Returns</a>
              <a href="mailto:support@musenz.com" style={{ color: "#999999" }}>Contact Us</a>
            </Text>
            <Text style={{ textAlign: "center", fontSize: "11px", color: "#555555", margin: 0 }}>
              © {new Date(createdAt).getFullYear()} MUSE NZ. All rights reserved.
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
