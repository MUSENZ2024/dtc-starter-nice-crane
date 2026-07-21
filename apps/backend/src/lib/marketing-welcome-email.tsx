import React from "react"
import { pretty, render } from "@react-email/render"
import { MarketingWelcomeTemplate, WelcomeDiscoveryTemplate, WelcomeLastChanceTemplate, WelcomeOfferDeliveryTemplate, WelcomePersonalCheckinTemplate, WelcomeTrustTemplate, type WelcomeEmailProps } from "../emails/MarketingWelcomeTemplate"

export const renderMarketingWelcomeEmail = async (props: WelcomeEmailProps) => {
  const shared = { ...props }
  delete (shared as Partial<WelcomeEmailProps>).templateKey
  const template = props.templateKey === "welcome_offer_delivery" ? <WelcomeOfferDeliveryTemplate {...shared} />
    : props.templateKey === "welcome_trust" ? <WelcomeTrustTemplate {...shared} />
      : props.templateKey === "welcome_discovery" ? <WelcomeDiscoveryTemplate {...shared} />
        : props.templateKey === "welcome_personal_checkin" ? <WelcomePersonalCheckinTemplate {...shared} />
          : props.templateKey === "welcome_last_chance" ? <WelcomeLastChanceTemplate {...shared} />
            : <MarketingWelcomeTemplate {...props} />
  return pretty(await render(template))
}
