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
import { colors, FONT_STACK, formatMoney, formatPaymentDate, logoUrl } from "./theme"

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
  // From order.metadata.split_pay_* — stamped by attach-split-pay-metadata-workflow
  totalCents: number
  baseCents: number
  finalCents: number
}

const textStyle = {
  fontFamily: FONT_STACK,
  color: colors.text,
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

// Gmail strips inline <svg> from email bodies entirely, so icons here are
// Unicode/text glyphs sized up via fontSize rather than vector paths.
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
      <Head />
      <Preview>Your MUSE Pay order #{displayId} is confirmed — 4 weekly payments, ships after the final one.</Preview>
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
            <Heading style={{ ...textStyle, fontSize: "26px", margin: "0 0 8px" }}>Your MUSE Pay order is confirmed.</Heading>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "14px", margin: 0 }}>
              Thanks {customerName}. We have received order #{displayId}, paid via MUSE Pay.
            </Text>
          </Section>

          {/* ============== ORDER SUMMARY — no stock badges, this order isn't shipping yet ============== */}
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
            <Row style={{ borderTop: `2px solid ${colors.black}` }}>
              <Column><Text style={{ ...textStyle, fontSize: "16px", fontWeight: "bold", margin: "14px 0 0" }}>Order total</Text></Column>
              <Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "16px", fontWeight: "bold", margin: "14px 0 0" }}>{formatMoney(totalCents / 100, currencyCode)}</Text></Column>
            </Row>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", margin: "14px 0 0" }}>Paid via MUSE Pay — 4 weekly payments, not charged in full today.</Text>
          </Section>

          {/* ============== PAYMENT SCHEDULE — the core of this email ============== */}
          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "20px", marginBottom: "14px" }}>
            <Text style={{ ...textStyle, fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", margin: "0 0 16px" }}>YOUR PAYMENT SCHEDULE</Text>
            {installments.map((installment, index) => (
              <Row
                key={installment.label}
                style={{
                  borderTop: index ? `1px solid ${colors.border}` : "none",
                  padding: "12px 0",
                  backgroundColor: index === 3 ? colors.greenSoft : "transparent",
                  borderRadius: index === 3 ? "8px" : 0,
                  paddingLeft: index === 3 ? "10px" : 0,
                  paddingRight: index === 3 ? "10px" : 0,
                }}
              >
                <Column>
                  <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", color: index === 3 ? colors.green : colors.black, margin: 0 }}>
                    {installment.label}
                  </Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", margin: "2px 0 0" }}>
                    {installment.sub || formatPaymentDate(createdAt, installment.days)}
                  </Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", color: colors.black, margin: 0 }}>{formatMoney(installment.cents / 100, currencyCode)}</Text>
                </Column>
              </Row>
            ))}
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", lineHeight: "1.6", margin: "14px 0 0" }}>
              Charged automatically to the card you saved at checkout. No action needed unless your card details change.
            </Text>
          </Section>

          {/* ============== EXPLICIT SHIPPING NOTE — softened, no cancellation claim ============== */}
          <Section style={{ backgroundColor: colors.blueSoft, borderRadius: "14px", padding: "18px 20px", marginBottom: "14px" }}>
            <Text style={{ ...textStyle, fontSize: "13.5px", fontWeight: "bold", color: colors.blue, margin: "0 0 6px" }}>When does this ship?</Text>
            <Text style={{ ...textStyle, color: colors.text, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              Your order ships once your final payment (Payment 4 of 4) is received — we'll send a separate shipping confirmation at that point. Nothing ships before then.
            </Text>
          </Section>

          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "20px", marginBottom: "14px" }}>
            <Text style={{ ...textStyle, fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", margin: "0 0 8px" }}>DELIVERING TO (ONCE PAID OFF)</Text>
            <Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{address}</Text>
          </Section>

          <Section style={{ textAlign: "center", padding: "10px 0 4px" }}>
            <Button href={trackingUrl} style={{ backgroundColor: colors.yellow, borderRadius: "999px", color: colors.black, fontFamily: FONT_STACK, fontSize: "13px", fontWeight: "bold", padding: "13px 22px", textDecoration: "none" }}>VIEW YOUR ORDER</Button>
          </Section>

          {/* ============== NEED HELP ============== */}
          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "20px", marginTop: "18px", marginBottom: "14px" }}>
            <Text style={{ ...textStyle, fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", margin: "0 0 14px" }}>NEED HELP WITH YOUR ORDER?</Text>

            <a href="mailto:support@musenz.com" style={{ textDecoration: "none" }}>
              <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "10px", marginBottom: "14px" }}>
                <Column style={{ width: "54px", padding: "12px 0 12px 14px", verticalAlign: "middle" }}>
                  <IconSquare>
                    <span style={{ fontFamily: FONT_STACK, fontSize: "14px", lineHeight: 1, color: colors.yellow }}>💬</span>
                  </IconSquare>
                </Column>
                <Column style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                  <Text style={{ ...textStyle, fontSize: "13px", fontWeight: "bold", color: colors.black, margin: 0 }}>Contact support →</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "11px", margin: "2px 0 0" }}>We respond within 24h</Text>
                </Column>
              </Row>
            </a>

            <Section style={{ backgroundColor: colors.creamDeep, borderRadius: "10px", padding: "12px 14px" }}>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", lineHeight: "1.6", margin: 0 }}>
                <strong style={{ color: colors.black }}>30-day returns</strong> apply from the date your order ships — not from today.
              </Text>
              <Text style={{ ...textStyle, color: colors.muted, fontSize: "12px", lineHeight: "1.6", margin: "12px 0 0", paddingTop: "12px", borderTop: `1px solid ${colors.border}` }}>
                <strong style={{ color: colors.black }}>Need to change your payment method or cancel?</strong> Email{" "}
                <a href="mailto:support@musenz.com" style={{ color: colors.text, fontWeight: "bold" }}>support@musenz.com</a>{" "}
                with order #{displayId} and we'll sort it out before your next payment date.
              </Text>
            </Section>
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
