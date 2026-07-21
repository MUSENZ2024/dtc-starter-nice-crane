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
import {
  bgcolor,
  colors,
  DARK_MODE_OVERRIDE_STYLE,
  FONT_STACK,
  formatMoney,
  logoUrl,
} from "./theme"

export type AbandonedCartEmailItem = {
  id: string
  title: string
  variantTitle?: string | null
  quantity: number
  unitPrice: number
  thumbnail?: string | null
}

export type AbandonedCartTemplateProps = {
  customerName: string
  currencyCode: string
  items: AbandonedCartEmailItem[]
  recoveryUrl: string
  segment: "first_time" | "returning"
  freeShippingQualified: boolean
  freeShippingRemaining: number
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

export function AbandonedCartTemplate({
  customerName,
  currencyCode,
  items,
  recoveryUrl,
  segment,
  freeShippingQualified,
  freeShippingRemaining,
}: AbandonedCartTemplateProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>{DARK_MODE_OVERRIDE_STYLE}</style>
      </Head>
      <Preview>Your MUSE cart is saved and ready when you are.</Preview>
      <Body
        className="em-bg-page"
        style={{ backgroundColor: colors.creamDeep, margin: 0, padding: 0 }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          bgcolor={colors.creamDeep}
          className="em-bg-page"
          style={{ backgroundColor: colors.creamDeep }}
        >
          <tbody>
            <tr>
              <td>
                <Section
                  className="em-bg-dark"
                  style={{
                    backgroundColor: colors.black,
                    padding: "26px 0",
                    textAlign: "center",
                  }}
                  bgcolor={colors.black}
                >
                  <Img
                    src={logoUrl}
                    width="150"
                    alt="MUSE NZ"
                    style={{ margin: "0 auto" }}
                  />
                </Section>

                <Container
                  style={{ maxWidth: "560px", margin: "0 auto", padding: "44px 18px 36px" }}
                >
                  <Section style={{ textAlign: "center", padding: "0 0 34px" }}>
                    <Text
                      style={{
                        ...textStyle,
                        color: colors.green,
                        fontSize: "11.5px",
                        fontWeight: "bold",
                        letterSpacing: "0.12em",
                        margin: "0 0 18px",
                      }}
                    >
                      YOUR CART IS SAVED
                    </Text>
                    <Heading
                      style={{
                        ...textStyle,
                        fontSize: "36px",
                        lineHeight: "1.15",
                        letterSpacing: "-0.02em",
                        margin: "0 0 18px",
                      }}
                    >
                      Still thinking it over?
                    </Heading>
                    <Text
                      style={{
                        ...textStyle,
                        color: colors.muted,
                        fontSize: "15px",
                        lineHeight: "1.6",
                        margin: "0 auto",
                        maxWidth: "430px",
                      }}
                    >
                      Hi {customerName}, the pieces you picked are still in your cart. {segment === "first_time"
                        ? "Shop with confidence — every order includes tracked delivery and eligible items have 30-day returns."
                        : "Your previous MUSE details make it quick to pick up where you left off."}
                    </Text>
                  </Section>

                  <Section
                    style={{ ...cardStyle, textAlign: "center" }}
                    bgcolor={colors.white}
                    className="em-bg-card"
                  >
                    <Text style={{ ...textStyle, fontSize: "16px", fontWeight: "bold", margin: "0 0 6px" }}>
                      {freeShippingQualified
                        ? "You’ve unlocked free NZ delivery."
                        : `${formatMoney(freeShippingRemaining, currencyCode)} away from free NZ delivery.`}
                    </Text>
                    <Text style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", margin: 0 }}>
                      Tracked delivery on every MUSE order.
                    </Text>
                  </Section>

                  <Section style={cardStyle} bgcolor={colors.white} className="em-bg-card">
                    <Text
                      style={{
                        ...textStyle,
                        color: colors.muted,
                        fontSize: "12px",
                        fontWeight: "bold",
                        letterSpacing: "0.1em",
                        margin: "0 0 18px",
                      }}
                    >
                      YOUR SELECTION
                    </Text>

                    {items.map((item, index) => (
                      <Section
                        key={item.id}
                        style={{
                          backgroundColor: colors.creamDeep,
                          borderRadius: "16px",
                          padding: "16px",
                          marginTop: index ? "10px" : 0,
                        }}
                        bgcolor={colors.creamDeep}
                        className="em-bg-soft"
                      >
                        <Row>
                          <Column style={{ width: "80px", verticalAlign: "middle" }}>
                            {item.thumbnail ? (
                              <Img
                                src={item.thumbnail}
                                alt={item.title}
                                width="72"
                                height="72"
                                style={{ borderRadius: "12px", objectFit: "cover" }}
                              />
                            ) : (
                              <table cellPadding="0" cellSpacing="0" role="presentation">
                                <tbody>
                                  <tr>
                                    <td
                                      {...bgcolor(colors.white)}
                                      style={{
                                        width: "72px",
                                        height: "72px",
                                        borderRadius: "12px",
                                        backgroundColor: colors.white,
                                      }}
                                    />
                                  </tr>
                                </tbody>
                              </table>
                            )}
                          </Column>
                          <Column style={{ paddingLeft: "14px", verticalAlign: "middle" }}>
                            <Text
                              style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", margin: 0 }}
                            >
                              {item.title}
                            </Text>
                            <Text
                              style={{
                                ...textStyle,
                                color: colors.muted,
                                fontSize: "12.5px",
                                margin: "4px 0 0",
                              }}
                            >
                              {item.variantTitle ? `${item.variantTitle} · ` : ""}Qty {item.quantity}
                            </Text>
                          </Column>
                          <Column style={{ width: "88px", textAlign: "right", verticalAlign: "middle" }}>
                            <Text
                              style={{ ...textStyle, fontSize: "15px", fontWeight: "bold", margin: 0 }}
                            >
                              {formatMoney(item.unitPrice * item.quantity, currencyCode)}
                            </Text>
                          </Column>
                        </Row>
                      </Section>
                    ))}

                    <Row style={{ borderTop: `2px solid ${colors.black}`, marginTop: "22px" }}>
                      <Column>
                        <Text
                          style={{ ...textStyle, fontSize: "17px", fontWeight: "bold", margin: "16px 0 0" }}
                        >
                          Cart subtotal
                        </Text>
                      </Column>
                      <Column style={{ textAlign: "right" }}>
                        <Text
                          style={{ ...textStyle, fontSize: "17px", fontWeight: "bold", margin: "16px 0 0" }}
                        >
                          {formatMoney(subtotal, currencyCode)}
                        </Text>
                      </Column>
                    </Row>
                  </Section>

                  <Section style={{ textAlign: "center", padding: "8px 0 28px" }}>
                    <Button
                      href={recoveryUrl}
                      style={{
                        backgroundColor: colors.black,
                        borderRadius: "999px",
                        color: colors.white,
                        fontFamily: FONT_STACK,
                        fontSize: "15px",
                        fontWeight: "bold",
                        padding: "15px 28px",
                        textDecoration: "none",
                      }}
                    >
                      Return to your cart
                    </Button>
                    <Text
                      style={{ ...textStyle, color: colors.muted, fontSize: "12.5px", lineHeight: "1.6", margin: "18px auto 0" }}
                    >
                      Need a hand? Reply to this email and the MUSE team will help.
                    </Text>
                  </Section>

                  <Section
                    className="em-bg-dark"
                    style={{ backgroundColor: colors.black, borderRadius: "20px", padding: "26px", textAlign: "center" }}
                    bgcolor={colors.black}
                  >
                    <Text
                      style={{ fontFamily: FONT_STACK, color: colors.white, fontSize: "12px", lineHeight: "1.6", margin: 0 }}
                    >
                      MUSE NZ · Auckland, New Zealand
                    </Text>
                  </Section>
                </Container>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  )
}
