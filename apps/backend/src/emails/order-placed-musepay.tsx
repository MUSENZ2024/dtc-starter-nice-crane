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
import { colors, FONT_STACK, formatMoney, formatPaymentDate, icons, logoUrl } from "./theme"

export type MusePayEmailItem = {
  id: string
  title: string
  variantTitle?: string | null
  quantity: number
  unitPrice: number
  thumbnail?: string | null
}

export type MusePayConfirmationProps = {
  customerName: string
  customerEmail: string
  displayId: string
  createdAt: string
  currencyCode: string
  items: MusePayEmailItem[]
  address: string
  trackingUrl: string
  // From order.metadata.split_pay_* — stamped on the cart before checkout
  // completion (see apps/storefront/src/app/api/split-pay/complete/route.ts),
  // so it's already present on the order the moment it's created
  totalCents: number
  baseCents: number
  finalCents: number
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

function IconSquare({ src, alt }: { src: string; alt: string }) {
  return (
    <table cellPadding="0" cellSpacing="0" role="presentation">
      <tr>
        <td style={{ width: "40px", height: "40px", borderRadius: "11px", backgroundColor: colors.black, textAlign: "center", verticalAlign: "middle" }}>
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

export function MusePayConfirmationTemplate({
  customerName,
  customerEmail,
  displayId,
  createdAt,
  currencyCode,
  items,
  address,
  trackingUrl,
  totalCents,
  baseCents,
  finalCents,
}: MusePayConfirmationProps) {
  // Stripe schedule: 3 weekly base-price phases starting today, then 1 final
  // phase a week after the third — matches getSplitPayInstallments() in
  // apps/storefront/src/lib/split-pay.ts.
  const installments = [
    { label: "Payment 1 of 4", sub: "today", days: 0, cents: baseCents },
    { label: "Payment 2 of 4", sub: "", days: 7, cents: baseCents },
    { label: "Payment 3 of 4", sub: "", days: 14, cents: baseCents },
    { label: "Payment 4 of 4 — final", sub: "", days: 21, cents: finalCents },
  ]

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>Your MUSE Pay order #{displayId} is confirmed — 4 weekly payments, ships after the final one.</Preview>
      <Body style={{ backgroundColor: colors.creamDeep, margin: 0, padding: 0 }}>
        <Section style={{ backgroundColor: colors.black, padding: "26px 0", textAlign: "center" }}>
          <Img src={logoUrl} width="150" alt="MUSE NZ" style={{ margin: "0 auto" }} />
        </Section>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "44px 18px 36px" }}>
          <Section style={{ textAlign: "center", padding: "0 0 36px" }}>
            <Text style={{ ...textStyle, color: colors.green, fontSize: "11.5px", fontWeight: "bold", letterSpacing: "0.12em", margin: "0 0 14px" }}>
              ORDER #{displayId} CONFIRMED
            </Text>
            <Heading style={{ ...textStyle, fontSize: "34px", lineHeight: "1.15", letterSpacing: "-0.02em", margin: "0 0 16px" }}>
              Your MUSE Pay order is confirmed.
            </Heading>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "15px", lineHeight: "1.6", margin: "0 auto", maxWidth: "400px" }}>
              Thanks {customerName} — paid via MUSE Pay across 4 weekly payments. Your order ships once the final payment clears.
            </Text>
            <Section style={{ marginTop: "26px" }}>
              <Button href={trackingUrl} style={{ backgroundColor: colors.yellow, borderRadius: "999px", color: colors.black, fontFamily: FONT_STACK, fontSize: "13.5px", fontWeight: "bold", letterSpacing: "0.03em", padding: "15px 28px", textDecoration: "none" }}>VIEW YOUR ORDER →</Button>
            </Section>
          </Section>

          {/* ============== ORDER SUMMARY — no stock badges, this order isn't shipping yet ============== */}
          <Section style={cardStyle}>
            <Text style={cardTitleStyle}>ORDER SUMMARY</Text>
            {items.map((item, index) => (
              <Section key={item.id} style={{ ...softCardStyle, marginTop: index ? "10px" : 0 }}>
                <Row>
                  <Column style={{ width: "80px", verticalAlign: "middle" }}>
                    {item.thumbnail ? (
                      <Img src={item.thumbnail} alt={item.title} width="72" height="72" style={{ borderRadius: "12px", objectFit: "cover" }} />
                    ) : (
                      <table cellPadding="0" cellSpacing="0" role="presentation">
                        <tr><td style={{ width: "72px", height: "72px", borderRadius: "12px", backgroundColor: colors.white }} /></tr>
                      </table>
                    )}
                  </Column>
                  <Column style={{ paddingLeft: "14px", verticalAlign: "middle" }}>
                    <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", margin: 0 }}>{item.title}</Text>
                    <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", margin: "4px 0 0" }}>
                      {item.variantTitle ? `${item.variantTitle} · ` : ""}Qty {item.quantity}
                    </Text>
                  </Column>
                  <Column style={{ width: "84px", textAlign: "right", verticalAlign: "middle" }}>
                    <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", margin: 0 }}>{formatMoney(item.unitPrice * item.quantity, currencyCode)}</Text>
                  </Column>
                </Row>
              </Section>
            ))}
            <Row style={{ borderTop: `2px solid ${colors.black}`, marginTop: "20px" }}>
              <Column><Text style={{ ...textStyle, fontSize: "17px", fontWeight: "bold", margin: "16px 0 0" }}>Order total</Text></Column>
              <Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "17px", fontWeight: "bold", margin: "16px 0 0" }}>{formatMoney(totalCents / 100, currencyCode)}</Text></Column>
            </Row>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", margin: "16px 0 0" }}>Paid via MUSE Pay — 4 weekly payments, not charged in full today.</Text>
          </Section>

          {/* ============== PAYMENT SCHEDULE — the core of this email ============== */}
          <Section style={cardStyle}>
            <Text style={cardTitleStyle}>YOUR PAYMENT SCHEDULE</Text>
            {installments.map((installment, index) => (
              <Row
                key={installment.label}
                style={{
                  borderTop: index ? `1px solid ${colors.border}` : "none",
                  padding: "14px 0",
                  backgroundColor: index === 3 ? colors.greenSoft : "transparent",
                  borderRadius: index === 3 ? "10px" : 0,
                  paddingLeft: index === 3 ? "12px" : 0,
                  paddingRight: index === 3 ? "12px" : 0,
                }}
              >
                <Column>
                  <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", color: index === 3 ? colors.green : colors.black, margin: 0 }}>
                    {installment.label}
                  </Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", margin: "3px 0 0" }}>
                    {installment.sub || formatPaymentDate(createdAt, installment.days)}
                  </Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", color: colors.black, margin: 0 }}>{formatMoney(installment.cents / 100, currencyCode)}</Text>
                </Column>
              </Row>
            ))}
            <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "12px", marginTop: "16px" }}>
              <Column style={{ width: "58px", padding: "13px 0 13px 14px", verticalAlign: "middle" }}>
                <IconSquare src={icons.card} alt="Card" />
              </Column>
              <Column style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                <Text style={{ ...textStyle, fontSize: "12.5px", lineHeight: "1.55", margin: 0 }}>
                  Charged automatically to the card you saved at checkout. No action needed unless your card details change.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ============== EXPLICIT SHIPPING NOTE — softened, no cancellation claim ============== */}
          <Section style={{ backgroundColor: colors.blueSoft, borderRadius: "16px", padding: "22px 24px", marginBottom: "16px" }}>
            <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", color: colors.blue, margin: "0 0 7px" }}>When does this ship?</Text>
            <Text style={{ ...textStyle, color: colors.text, fontSize: "13.5px", lineHeight: "1.65", margin: 0 }}>
              Your order ships once your final payment (Payment 4 of 4) is received — we'll send a separate shipping confirmation at that point. Nothing ships before then.
            </Text>
          </Section>

          <Section style={cardStyle}>
            <Text style={cardTitleStyle}>DELIVERING TO (ONCE PAID OFF)</Text>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", lineHeight: "1.65", margin: 0 }}>{address}</Text>
          </Section>

          {/* ============== NEED HELP ============== */}
          <Section style={{ ...cardStyle, marginTop: "22px" }}>
            <Text style={cardTitleStyle}>NEED HELP WITH YOUR ORDER?</Text>

            <a href="mailto:support@musenz.com" style={{ textDecoration: "none" }}>
              <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "12px", marginBottom: "16px" }}>
                <Column style={{ width: "58px", padding: "13px 0 13px 14px", verticalAlign: "middle" }}>
                  <IconSquare src={icons.chat} alt="Contact support" />
                </Column>
                <Column style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                  <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", color: colors.black, margin: 0 }}>Contact support →</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", margin: "2px 0 0" }}>We respond within 24h</Text>
                </Column>
              </Row>
            </a>

            <Section style={{ backgroundColor: colors.creamDeep, borderRadius: "12px", padding: "14px 16px" }}>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", lineHeight: "1.65", margin: 0 }}>
                <strong style={{ color: colors.black }}>30-day returns</strong> apply from the date your order ships — not from today.
              </Text>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", lineHeight: "1.65", margin: "13px 0 0", paddingTop: "13px", borderTop: `1px solid ${colors.border}` }}>
                <strong style={{ color: colors.black }}>Need to change your payment method or cancel?</strong> Email{" "}
                <a href="mailto:support@musenz.com" style={{ color: colors.text, fontWeight: "bold" }}>support@musenz.com</a>{" "}
                with order #{displayId} and we'll sort it out before your next payment date.
              </Text>
            </Section>
          </Section>

          <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", textAlign: "center", margin: "6px 0 0" }}>Confirmation sent to {customerEmail}</Text>
        </Container>

        {/* ============== FOOTER ============== */}
        <Section style={{ backgroundColor: colors.black, padding: "40px 18px 30px", marginTop: "22px" }}>
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

export default function getOrderPlacedMusePayTemplate(props: MusePayConfirmationProps) {
  return <MusePayConfirmationTemplate {...props} />
}
