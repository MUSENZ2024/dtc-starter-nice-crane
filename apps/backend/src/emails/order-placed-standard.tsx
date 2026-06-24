import { OrderConfirmationProps, OrderConfirmationTemplate } from "./OrderConfirmationTemplate"

export default function getOrderPlacedStandardTemplate(props: OrderConfirmationProps) {
  return <OrderConfirmationTemplate {...props} />
}
