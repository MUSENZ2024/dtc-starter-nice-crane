import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from "@react-email/components"
import { colors, DARK_MODE_OVERRIDE_STYLE, FONT_STACK, formatMoney, logoUrl } from "./theme"
import type { AbandonedCartTemplateProps } from "./AbandonedCartTemplate"

export function AbandonedCartUrgencyTemplate({ customerName, recoveryUrl, items, freeShippingQualified, freeShippingRemaining, currencyCode }: AbandonedCartTemplateProps) {
  return (
    <Html lang="en">
      <Head><style>{DARK_MODE_OVERRIDE_STYLE}</style></Head>
      <Preview>Your MUSE selection is still available, but stock is not reserved.</Preview>
      <Body className="em-bg-page" style={{ backgroundColor: colors.creamDeep, margin: 0, padding: 0 }}>
        <Section className="em-bg-dark" style={{ backgroundColor: colors.black, padding: "26px 0", textAlign: "center" }} bgcolor={colors.black}>
          <Img src={logoUrl} width="150" alt="MUSE NZ" style={{ margin: "0 auto" }} />
        </Section>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 18px" }}>
          <Section className="em-bg-card" style={{ backgroundColor: colors.white, borderRadius: "20px", padding: "34px 28px", textAlign: "center" }} bgcolor={colors.white}>
            <Text style={{ fontFamily: FONT_STACK, color: colors.green, fontSize: "11.5px", fontWeight: "bold", letterSpacing: "0.12em", margin: "0 0 16px" }}>
              FINAL REMINDER
            </Text>
            <Heading style={{ fontFamily: FONT_STACK, color: colors.text, fontSize: "34px", lineHeight: "1.15", margin: "0 0 18px" }}>
              Your cart won’t stay available forever.
            </Heading>
            <Text style={{ fontFamily: FONT_STACK, color: colors.muted, fontSize: "15px", lineHeight: "1.65", margin: "0 0 24px" }}>
              Hi {customerName}, your {items.length === 1 ? "item is" : `${items.length} items are`} still in your cart. Stock isn’t reserved until checkout, so finish your order before your size sells out.
            </Text>
            <Text style={{ fontFamily: FONT_STACK, color: colors.text, fontSize: "14px", fontWeight: "bold", lineHeight: "1.6", margin: "0 0 24px" }}>
              {freeShippingQualified
                ? "You’ve unlocked free NZ delivery."
                : `${formatMoney(freeShippingRemaining, currencyCode)} away from free NZ delivery.`}
            </Text>
            <Button href={recoveryUrl} style={{ backgroundColor: colors.black, borderRadius: "999px", color: colors.white, fontFamily: FONT_STACK, fontSize: "15px", fontWeight: "bold", padding: "15px 28px", textDecoration: "none" }}>
              Complete your order
            </Button>
            <Text style={{ fontFamily: FONT_STACK, color: colors.muted, fontSize: "12.5px", lineHeight: "1.6", margin: "22px 0 0" }}>
              No discount added — simply the last reminder for this cart.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
