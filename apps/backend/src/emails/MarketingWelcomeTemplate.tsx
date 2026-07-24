import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components"
import React from "react"
import { colors, FONT_STACK } from "./theme"
import { WelcomeDiscoveryEmail } from "./WelcomeDiscoveryEmailTemplate"
import { WelcomeLastChanceEmail } from "./WelcomeLastChanceEmailTemplate"
import { WelcomeOfferDeliveryEmail } from "./WelcomeOfferDeliveryTemplate"
import { WelcomeTrustEmail } from "./WelcomeTrustEmailTemplate"

export type WelcomeEmailProps = { templateKey: string; previewText: string; firstName?: string | null; code: string; expiresAt: string; preference: string; unsubscribeUrl: string; shopUrl: string }

const copy: Record<string, { eyebrow: string; heading: string; body: string; cta: string }> = {
  welcome_offer_delivery: { eyebrow: "WELCOME TO MUSE", heading: "Your NZ$20 welcome code is here.", body: "Use it on your first qualifying order of NZ$150 or more before the expiry shown below.", cta: "SHOP NOW" },
  welcome_trust: { eyebrow: "SHOP WITH CONFIDENCE", heading: "What shopping with MUSE looks like.", body: "Secure checkout, tracked delivery, real New Zealand support, and 30-day returns on eligible orders.", cta: "SEE WHAT'S MOVING" },
  welcome_discovery: { eyebrow: "YOUR MUSE EDIT", heading: "A few pieces worth knowing about.", body: "This edit follows the preference you chose. Stock and availability are always confirmed on the product page.", cta: "EXPLORE YOUR EDIT" },
  welcome_last_chance: { eyebrow: "FINAL REMINDER", heading: "Your NZ$20 welcome offer ends tonight.", body: "A quick reminder—use your code before the expiry time shown below on your first qualifying order of NZ$150 or more.", cta: "USE MY CODE" },
}

export const MarketingWelcomeTemplate = (props: WelcomeEmailProps) => {
  const plain = props.templateKey === "welcome_personal_checkin"
  const item = copy[props.templateKey] || copy.welcome_offer_delivery
  if (plain) return <Html><Head /><Preview>{props.previewText}</Preview><Body style={{ backgroundColor: colors.white, fontFamily: FONT_STACK }}><Container style={{ maxWidth: 560, padding: "32px 20px" }}><Text>Hey {props.firstName || "there"},</Text><Text>Just checking that your MUSE welcome code came through properly. It’s still active if you’ve been deciding on a size or product. Reply to this email if you need help choosing.</Text><Text><strong>Your code: {props.code}</strong></Text><Text>Expires: {props.expiresAt}</Text><Text>— MUSE NZ</Text><Text style={{ color: colors.muted, fontSize: 12 }}><a href={props.unsubscribeUrl}>Unsubscribe</a></Text></Container></Body></Html>
  return <Html><Head /><Preview>{props.previewText}</Preview><Body style={{ margin: 0, backgroundColor: colors.creamDeep, fontFamily: FONT_STACK, color: colors.text }}><Container style={{ maxWidth: 620, margin: "0 auto", padding: "32px 20px" }}><Section style={{ backgroundColor: colors.black, padding: 24 }}><Text style={{ color: colors.yellow, fontSize: 12, fontWeight: 700 }}>{item.eyebrow}</Text><Heading style={{ color: colors.white, margin: "8px 0" }}>{item.heading}</Heading></Section><Section style={{ backgroundColor: colors.white, padding: 28 }}><Text>Hey {props.firstName || "there"},</Text><Text>{item.body}</Text><Section style={{ border: `1px solid ${colors.border}`, padding: 18, textAlign: "center" }}><Text style={{ margin: 0, fontSize: 12, color: colors.muted }}>YOUR CODE</Text><Heading as="h2" style={{ margin: "8px 0" }}>{props.code}</Heading><Text style={{ margin: 0, fontSize: 13 }}>Expires {props.expiresAt}</Text></Section><Button href={props.shopUrl} style={{ display: "block", marginTop: 22, backgroundColor: colors.black, color: colors.white, padding: "14px 22px", textAlign: "center" }}>{item.cta}</Button><Text style={{ fontSize: 13, color: colors.muted }}>Free NZ delivery applies at the current storefront threshold. Your selected interest: {props.preference}.</Text><Text style={{ fontSize: 12, color: colors.muted }}><a href={props.unsubscribeUrl}>Unsubscribe</a> from MUSE marketing emails.</Text></Section></Container></Body></Html>
}

export const WelcomeOfferDeliveryTemplate = (props: Omit<WelcomeEmailProps, "templateKey">) => (
  <WelcomeOfferDeliveryEmail
    previewText={props.previewText}
    firstName={props.firstName}
    code={props.code}
    expiresAt={props.expiresAt}
    unsubscribeUrl={props.unsubscribeUrl}
    shopUrl={props.shopUrl}
  />
)
export const WelcomeTrustTemplate = (props: Omit<WelcomeEmailProps, "templateKey">) => (
  <WelcomeTrustEmail
    previewText={props.previewText}
    firstName={props.firstName}
    code={props.code}
    expiresAt={props.expiresAt}
    unsubscribeUrl={props.unsubscribeUrl}
    shopUrl={props.shopUrl}
  />
)
export const WelcomeDiscoveryTemplate = (props: Omit<WelcomeEmailProps, "templateKey">) => (
  <WelcomeDiscoveryEmail
    previewText={props.previewText}
    firstName={props.firstName}
    code={props.code}
    expiresAt={props.expiresAt}
    unsubscribeUrl={props.unsubscribeUrl}
    shopUrl={props.shopUrl}
  />
)
export const WelcomePersonalCheckinTemplate = (props: Omit<WelcomeEmailProps, "templateKey">) => <MarketingWelcomeTemplate {...props} templateKey="welcome_personal_checkin" />
export const WelcomeLastChanceTemplate = (props: Omit<WelcomeEmailProps, "templateKey">) => (
  <WelcomeLastChanceEmail
    previewText={props.previewText}
    firstName={props.firstName}
    code={props.code}
    expiresAt={props.expiresAt}
    unsubscribeUrl={props.unsubscribeUrl}
    shopUrl={props.shopUrl}
  />
)
