import { OrderConfirmationProps, OrderConfirmationTemplate } from "./OrderConfirmationTemplate"

export default function getOrderPlacedMixedTemplate(props: OrderConfirmationProps) {
  return <OrderConfirmationTemplate {...props} />
}
