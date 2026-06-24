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
import { colors, formatMoney, formatPaymentDate, logoUrl } from "./theme"

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
  fontFamily: "Arial, Helvetica, sans-serif",
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

function SocialIcon({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ textDecoration: "none" }}>
      <table cellPadding="0" cellSpacing="0" role="presentation" style={{ display: "inline-table", marginRight: "10px" }}>
        <tr>
          <td style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)", textAlign: "center", verticalAlign: "middle" }}>
            {children}
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
                <td style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: colors.green, textAlign: "center", verticalAlign: "middle" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
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
            <Button href={trackingUrl} style={{ backgroundColor: colors.yellow, borderRadius: "999px", color: colors.black, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontWeight: "bold", padding: "13px 22px", textDecoration: "none" }}>VIEW YOUR ORDER</Button>
          </Section>

          {/* ============== NEED HELP ============== */}
          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "20px", marginTop: "18px", marginBottom: "14px" }}>
            <Text style={{ ...textStyle, fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", margin: "0 0 14px" }}>NEED HELP WITH YOUR ORDER?</Text>

            <a href="mailto:support@musenz.com" style={{ textDecoration: "none" }}>
              <Row style={{ backgroundColor: colors.creamDeep, borderRadius: "10px", marginBottom: "14px" }}>
                <Column style={{ width: "54px", padding: "12px 0 12px 14px", verticalAlign: "middle" }}>
                  <IconSquare>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={colors.yellow} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
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
              <SocialIcon href="https://instagram.com/muse.nz">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.cream} strokeWidth="1.7">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.2" fill={colors.cream} stroke="none" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://facebook.com/muse.nz">
                <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.cream} stroke="none">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://tiktok.com/@muse.nz">
                <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.cream}>
                  <path d="M12.5 2h3.1c.2 1.6 1.4 2.9 3 3.1v3.2c-1.4 0-2.7-.4-3.8-1.2v6.4a5.3 5.3 0 11-5.3-5.3c.2 0 .4 0 .6.03v3.2a2.1 2.1 0 102.1 2.1V2z" />
                </svg>
              </SocialIcon>
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
