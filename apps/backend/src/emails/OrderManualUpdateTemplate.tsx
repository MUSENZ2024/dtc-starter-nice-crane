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
import { bgcolor, colors, DARK_MODE_OVERRIDE_STYLE, FONT_STACK, formatMoney, icons, logoUrl } from "./theme"
import type { EmailItem } from "./OrderConfirmationTemplate"

export type ManualOrderUpdateKey =
  | "order_edited"
  | "order_invoice"
  | "order_payment_receipt"
  | "order_link"
  | "payment_reminder"
  | "payment_error"
  | "pending_payment_success"
  | "refund_update"
  | "order_cancelled"
  | "delivery_address_update"
  | "shipping_update"
  | "out_for_delivery"
  | "delivered"
  | "ready_for_pickup"
  | "picked_up_by_customer"
  | "order_out_for_local_delivery"
  | "order_locally_delivered"
  | "order_missed_local_delivery"
  | "return_created"
  | "return_received"
  | "return_approved"
  | "return_declined"
  | "store_credit_issued"
  | "gift_card_created"
  | "customer_account_invite"
  | "customer_account_welcome"
  | "customer_password_reset"
  | "contact_customer"
  | "customer_email_change_confirmation"

export type ManualOrderUpdateProps = {
  templateKey: ManualOrderUpdateKey
  customerName: string
  customerEmail: string
  displayId: string
  currencyCode: string
  shippingMethodLabel: string
  addressLines: string[]
  phone?: string | null
  items: EmailItem[]
  subtotal: number
  shippingTotal: number
  shippingProtectionAmount?: number
  discountTotal?: number
  taxTotal: number
  total: number
  note?: string | null
}

export const MANUAL_ORDER_UPDATE_TEMPLATES: Record<
  ManualOrderUpdateKey,
  {
    label: string
    subject: string
    eyebrow: string
    heading: string
    intro: string
    detail: string
    ctaLabel?: string
  }
> = {
  order_edited: {
    label: "Order edited",
    subject: "MUSE NZ: Your order has been updated",
    eyebrow: "ORDER UPDATED",
    heading: "Your order has been updated.",
    intro: "Thanks {name}, we have made a change to your order.",
    detail: "The latest order details are shown below. If anything looks off, reply to this email and we will help.",
    ctaLabel: "View order",
  },
  order_invoice: {
    label: "Order invoice",
    subject: "MUSE NZ: Invoice for your order",
    eyebrow: "ORDER INVOICE",
    heading: "Your order invoice is ready.",
    intro: "Hi {name}, here is the invoice update for your order.",
    detail: "The latest order totals, delivery details, and items are shown below for your records.",
  },
  order_payment_receipt: {
    label: "Order payment receipt",
    subject: "MUSE NZ: Payment receipt for your order",
    eyebrow: "PAYMENT RECEIPT",
    heading: "Your payment has been received.",
    intro: "Thanks {name}, your payment has been received.",
    detail: "We have included the current order summary and delivery details below.",
  },
  order_link: {
    label: "Order link",
    subject: "MUSE NZ: Your order link",
    eyebrow: "ORDER LINK",
    heading: "Here is your order link.",
    intro: "Hi {name}, we are sending through a fresh link for your order.",
    detail: "Use the details below to confirm everything still looks right. Reply here if you need anything changed.",
  },
  payment_reminder: {
    label: "Payment reminder",
    subject: "MUSE NZ: Payment reminder for your order",
    eyebrow: "PAYMENT REMINDER",
    heading: "A payment is still pending.",
    intro: "Hi {name}, your order is waiting on payment.",
    detail: "Once payment is complete, we can keep your order moving. Reply here if you need a hand.",
    ctaLabel: "View order",
  },
  payment_error: {
    label: "Payment issue",
    subject: "MUSE NZ: Payment issue with your order",
    eyebrow: "PAYMENT ISSUE",
    heading: "We could not process your payment.",
    intro: "Hi {name}, there was an issue processing payment for your order.",
    detail: "Please check your payment details or reply to this email and we will help sort it quickly.",
    ctaLabel: "View order",
  },
  pending_payment_success: {
    label: "Pending payment success",
    subject: "MUSE NZ: Your payment has been processed",
    eyebrow: "PAYMENT PROCESSED",
    heading: "Your payment has gone through.",
    intro: "Thanks {name}, your pending payment has now been processed.",
    detail: "Your order is moving again. The latest order details are included below.",
  },
  refund_update: {
    label: "Refund update",
    subject: "MUSE NZ: Refund update for your order",
    eyebrow: "REFUND UPDATE",
    heading: "Your refund has been updated.",
    intro: "Hi {name}, we have an update about your refund.",
    detail: "Refund timing can depend on your bank or card provider. The order details are included below for reference.",
  },
  order_cancelled: {
    label: "Order cancelled",
    subject: "MUSE NZ: Your order has been cancelled",
    eyebrow: "ORDER CANCELLED",
    heading: "Your order has been cancelled.",
    intro: "Hi {name}, your order has been cancelled.",
    detail: "If this does not look right, reply to this email and we will check it for you.",
  },
  delivery_address_update: {
    label: "Delivery or address update",
    subject: "MUSE NZ: Delivery update for your order",
    eyebrow: "DELIVERY UPDATE",
    heading: "Your delivery details have been updated.",
    intro: "Thanks {name}, we have updated your delivery details.",
    detail: "The current delivery address and order summary are shown below. Reply here if anything needs another look.",
    ctaLabel: "View order",
  },
  shipping_update: {
    label: "Shipping update",
    subject: "MUSE NZ: Shipping update for your order",
    eyebrow: "SHIPPING UPDATE",
    heading: "We have a shipping update.",
    intro: "Hi {name}, there is an update on your delivery.",
    detail: "The current shipping method, delivery address, and order summary are shown below.",
  },
  out_for_delivery: {
    label: "Out for delivery",
    subject: "MUSE NZ: Your order is out for delivery",
    eyebrow: "OUT FOR DELIVERY",
    heading: "Your order is out for delivery.",
    intro: "Hi {name}, your order is on its way to you today.",
    detail: "Keep an eye out for the courier. If delivery needs a signature, they may leave collection instructions if no one is home.",
  },
  delivered: {
    label: "Delivered",
    subject: "MUSE NZ: Your order has been delivered",
    eyebrow: "DELIVERED",
    heading: "Your order has been delivered.",
    intro: "Hi {name}, your order has been marked as delivered.",
    detail: "If it is not with you, check around your delivery address first, then reply here and we will help.",
  },
  ready_for_pickup: {
    label: "Ready for pickup",
    subject: "MUSE NZ: Your order is ready for pickup",
    eyebrow: "READY FOR PICKUP",
    heading: "Your order is ready for pickup.",
    intro: "Hi {name}, your order is ready to be collected.",
    detail: "The order summary is below. Reply here if you need pickup details resent or need someone else to collect.",
  },
  picked_up_by_customer: {
    label: "Picked up by customer",
    subject: "MUSE NZ: Your order has been picked up",
    eyebrow: "PICKED UP",
    heading: "Your order has been picked up.",
    intro: "Thanks {name}, your order has now been collected.",
    detail: "We have included the order summary below for your records.",
  },
  order_out_for_local_delivery: {
    label: "Order out for local delivery",
    subject: "MUSE NZ: Your order is out for local delivery",
    eyebrow: "LOCAL DELIVERY",
    heading: "Your order is out for delivery.",
    intro: "Hi {name}, your order is out with local delivery.",
    detail: "The delivery address and order summary are shown below. Reply here if anything looks wrong.",
  },
  order_locally_delivered: {
    label: "Order locally delivered",
    subject: "MUSE NZ: Your order has been delivered",
    eyebrow: "LOCAL DELIVERY",
    heading: "Your order has been delivered.",
    intro: "Hi {name}, your local delivery has been completed.",
    detail: "If anything is not right with the delivery, reply here and we will check it for you.",
  },
  order_missed_local_delivery: {
    label: "Order missed local delivery",
    subject: "MUSE NZ: We missed you for delivery",
    eyebrow: "DELIVERY MISSED",
    heading: "We missed you for delivery.",
    intro: "Hi {name}, we could not complete delivery this time.",
    detail: "Reply to this email and we will help arrange the next step.",
  },
  return_created: {
    label: "Return created",
    subject: "MUSE NZ: Your return has been created",
    eyebrow: "RETURN CREATED",
    heading: "Your return has been created.",
    intro: "Hi {name}, we have created a return for your order.",
    detail: "Return details and the original order summary are included below for reference.",
  },
  return_received: {
    label: "Return received",
    subject: "MUSE NZ: We received your return",
    eyebrow: "RETURN RECEIVED",
    heading: "We have received your return.",
    intro: "Hi {name}, your return has arrived with us.",
    detail: "We will inspect it and update you once the next step is complete.",
  },
  return_approved: {
    label: "Return approved",
    subject: "MUSE NZ: Your return has been approved",
    eyebrow: "RETURN APPROVED",
    heading: "Your return has been approved.",
    intro: "Hi {name}, your return request has been approved.",
    detail: "We will process the next step from here. The original order details are included below.",
  },
  return_declined: {
    label: "Return declined",
    subject: "MUSE NZ: Return update for your order",
    eyebrow: "RETURN UPDATE",
    heading: "We have an update on your return.",
    intro: "Hi {name}, we have reviewed your return request.",
    detail: "The current decision is shown in the note above if added. Reply here if you want us to take another look.",
  },
  store_credit_issued: {
    label: "Store credit issued",
    subject: "MUSE NZ: Store credit has been issued",
    eyebrow: "STORE CREDIT",
    heading: "Your store credit is ready.",
    intro: "Hi {name}, store credit has been issued for your order.",
    detail: "We have included the related order details below for reference.",
  },
  gift_card_created: {
    label: "Gift card created",
    subject: "MUSE NZ: Your gift card is ready",
    eyebrow: "GIFT CARD",
    heading: "Your gift card is ready.",
    intro: "Hi {name}, your gift card has been created.",
    detail: "The related order details are included below. Reply here if you need the gift card details resent.",
  },
  customer_account_invite: {
    label: "Customer account invite",
    subject: "MUSE NZ: Create your MUSE account",
    eyebrow: "ACCOUNT INVITE",
    heading: "Your MUSE account invite is ready.",
    intro: "Hi {name}, we have sent an invite to create your MUSE account.",
    detail: "Creating an account makes it easier to check orders, delivery updates, and future purchases.",
  },
  customer_account_welcome: {
    label: "Customer account welcome",
    subject: "MUSE NZ: Welcome to your MUSE account",
    eyebrow: "ACCOUNT READY",
    heading: "Welcome to your MUSE account.",
    intro: "Hi {name}, your MUSE account is ready.",
    detail: "You can use it to keep track of your orders and delivery updates.",
  },
  customer_password_reset: {
    label: "Customer password reset",
    subject: "MUSE NZ: Reset your password",
    eyebrow: "PASSWORD RESET",
    heading: "Reset your MUSE password.",
    intro: "Hi {name}, we received a request to reset your password.",
    detail: "If this was not you, you can ignore this email or reply here and we will help.",
  },
  contact_customer: {
    label: "Contact customer",
    subject: "MUSE NZ: Update about your order",
    eyebrow: "MUSE UPDATE",
    heading: "A quick update from MUSE.",
    intro: "Hi {name}, we have an update about your order.",
    detail: "The latest order details are included below. Reply to this email if you need anything.",
  },
  customer_email_change_confirmation: {
    label: "Email change confirmation",
    subject: "MUSE NZ: Email address updated",
    eyebrow: "EMAIL UPDATED",
    heading: "Your email address has been updated.",
    intro: "Hi {name}, your email address has been updated.",
    detail: "Future order updates will be sent to the email address on this order.",
  },
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

export function OrderManualUpdateTemplate({
  templateKey,
  customerName,
  customerEmail,
  displayId,
  currencyCode,
  shippingMethodLabel,
  addressLines,
  phone,
  items,
  subtotal,
  shippingTotal,
  shippingProtectionAmount = 0,
  discountTotal = 0,
  taxTotal,
  total,
  note,
}: ManualOrderUpdateProps) {
  const template = MANUAL_ORDER_UPDATE_TEMPLATES[templateKey]
  const intro = template.intro.replace("{name}", customerName)

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>{DARK_MODE_OVERRIDE_STYLE}</style>
      </Head>
      <Preview>{template.subject}</Preview>
      <Body className="em-bg-page" style={{ backgroundColor: colors.creamDeep, margin: 0, padding: 0, colorScheme: "light" }}>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" bgcolor={colors.creamDeep} className="em-bg-page" style={{ backgroundColor: colors.creamDeep }}>
          <tr>
            <td>
              <Section className="em-bg-dark" style={{ backgroundColor: colors.black, padding: "26px 0", textAlign: "center" }} bgcolor={colors.black}>
                <Img src={logoUrl} width="150" alt="MUSE NZ" style={{ margin: "0 auto" }} />
              </Section>

              <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "44px 18px 36px" }}>
                <Section style={{ textAlign: "center", padding: "0 0 34px" }}>
                  <Text style={{ ...textStyle, color: colors.green, fontSize: "11.5px", fontWeight: "bold", letterSpacing: "0.12em", margin: "0 0 18px" }}>
                    {template.eyebrow}
                  </Text>
                  <Heading style={{ ...textStyle, fontSize: "36px", lineHeight: "1.15", letterSpacing: "-0.02em", margin: "0 0 18px" }}>
                    {template.heading}
                  </Heading>
                  <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto 22px" }}>
                    <tr>
                      <td
                        {...bgcolor(colors.black)}
                        style={{
                          backgroundColor: colors.black,
                          borderRadius: "999px",
                          padding: "12px 24px",
                          fontFamily: FONT_STACK,
                          fontSize: "13px",
                          fontWeight: "bold",
                          color: colors.white,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Order <span style={{ color: colors.yellow }}>#{displayId}</span>
                      </td>
                    </tr>
                  </table>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "15px", lineHeight: "1.6", margin: "0 auto", maxWidth: "420px" }}>
                    {intro}
                  </Text>
                </Section>

                <Section style={cardStyle} bgcolor={colors.white} className="em-bg-card">
                  <Text style={cardTitleStyle}>UPDATE DETAILS</Text>
                  <Text style={{ ...textStyle, color: colors.text, fontSize: "13.5px", lineHeight: "1.7", margin: "0 0 14px" }}>
                    {template.detail}
                  </Text>
                  {note ? (
                    <Section style={{ backgroundColor: colors.creamDeep, borderRadius: "16px", padding: "18px", marginTop: "16px" }} bgcolor={colors.creamDeep} className="em-bg-soft">
                      <Text style={{ ...textStyle, color: colors.black, fontSize: "13.5px", fontWeight: "bold", margin: "0 0 7px" }}>
                        Note from MUSE
                      </Text>
                      <Text style={{ ...textStyle, color: colors.text, fontSize: "13.5px", lineHeight: "1.65", margin: 0 }}>
                        {note}
                      </Text>
                    </Section>
                  ) : null}
                </Section>

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
                              <tr>
                                <td {...bgcolor(colors.white)} style={{ width: "72px", height: "72px", borderRadius: "12px", backgroundColor: colors.white }} />
                              </tr>
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
                    {discountTotal > 0 ? <Row><Column><Text style={{ ...textStyle, color: colors.green, fontSize: "13.5px", margin: "7px 0" }}>Discount</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, color: colors.green, fontSize: "13.5px", margin: "7px 0" }}>-{formatMoney(discountTotal, currencyCode)}</Text></Column></Row> : null}
                    <Row><Column><Text style={{ ...textStyle, color: colors.muted, fontSize: "13.5px", margin: "7px 0" }}>GST included</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "13.5px", margin: "7px 0" }}>{formatMoney(taxTotal, currencyCode)}</Text></Column></Row>
                    <Row style={{ borderTop: `2px solid ${colors.black}` }}><Column><Text style={{ ...textStyle, fontSize: "17px", fontWeight: "bold", margin: "16px 0 0" }}>Total paid</Text></Column><Column style={{ textAlign: "right" }}><Text style={{ ...textStyle, fontSize: "17px", fontWeight: "bold", margin: "16px 0 0" }}>{formatMoney(total, currencyCode)}</Text></Column></Row>
                  </Section>
                </Section>

                <Section style={cardStyle} bgcolor={colors.white} className="em-bg-card">
                  <Text style={cardTitleStyle}>DELIVERING TO</Text>
                  <AddressLines lines={addressLines} phone={phone} />
                </Section>

                <Section style={{ ...cardStyle, padding: "20px 22px", textAlign: "center" }}>
                  <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", color: colors.black, margin: "0 0 6px" }}>Need a hand?</Text>
                  <Text style={{ ...textStyle, color: colors.muted, fontSize: "13px", lineHeight: "1.65", margin: 0 }}>
                    Reply to this email and the MUSE team will help.
                  </Text>
                </Section>

                <Text style={{ ...textStyle, color: colors.muted, fontSize: "11.5px", textAlign: "center", margin: "6px 0 0" }}>
                  Update sent to {customerEmail}
                </Text>
              </Container>

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
                    <a href="https://store.musenz.com/nz/track" style={{ color: "#999999", marginRight: "16px" }}>Track Order</a>
                    <a href="https://store.musenz.com/returns" style={{ color: "#999999", marginRight: "16px" }}>Returns</a>
                    <a href="mailto:support@musenz.com" style={{ color: "#999999" }}>Contact Us</a>
                  </Text>
                  <Text style={{ textAlign: "center", fontSize: "11px", color: "#555555", margin: 0 }}>
                    © {new Date().getFullYear()} MUSE NZ. All rights reserved.
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
