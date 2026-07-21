import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { colors, FONT_STACK, formatMoney } from "./theme";
import type { AbandonedCartTemplateProps } from "./AbandonedCartTemplate";

export function AbandonedCartPersonalTemplate({
  customerName,
  recoveryUrl,
  segment,
  freeShippingQualified,
  freeShippingRemaining,
  currencyCode,
}: AbandonedCartTemplateProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Did you need help finishing your MUSE order?</Preview>
      <Body
        style={{
          backgroundColor: colors.white,
          margin: 0,
          padding: "24px",
          fontFamily: FONT_STACK,
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Section>
            <Text
              style={{
                color: colors.text,
                fontSize: "15px",
                lineHeight: "1.7",
                margin: "0 0 18px",
              }}
            >
              Hey {customerName},
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: "15px",
                lineHeight: "1.7",
                margin: "0 0 18px",
              }}
            >
              I noticed you didn’t finish checking out. If you had a question
              about sizing, delivery or one of the products, reply to this email
              and we’ll help.
            </Text>
            {segment === "first_time" ? (
              <Text
                style={{
                  color: colors.text,
                  fontSize: "15px",
                  lineHeight: "1.7",
                  margin: "0 0 18px",
                }}
              >
                MUSE orders include tracked delivery, and eligible items can be
                returned within 30 days.
              </Text>
            ) : null}
            <Text
              style={{
                color: colors.text,
                fontSize: "15px",
                lineHeight: "1.7",
                margin: "0 0 22px",
              }}
            >
              {freeShippingQualified
                ? "Your cart already qualifies for free NZ delivery."
                : `You’re ${formatMoney(freeShippingRemaining, currencyCode)} away from free NZ delivery.`}
            </Text>
            <Button
              href={recoveryUrl}
              style={{
                backgroundColor: colors.black,
                borderRadius: "999px",
                color: colors.white,
                fontSize: "14px",
                fontWeight: "bold",
                padding: "13px 22px",
                textDecoration: "none",
              }}
            >
              Return to your cart
            </Button>
            <Text
              style={{
                color: colors.text,
                fontSize: "15px",
                lineHeight: "1.7",
                margin: "28px 0 0",
              }}
            >
              MUSE NZ
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
