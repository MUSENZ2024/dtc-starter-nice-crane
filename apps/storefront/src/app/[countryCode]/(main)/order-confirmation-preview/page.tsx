import { HttpTypes } from "@medusajs/types"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Order Confirmation Preview",
  description: "Preview the MUSE order confirmation page",
}

const previewOrder = {
  id: "order_preview_muse",
  display_id: 1207,
  email: "customer@example.com",
  currency_code: "nzd",
  created_at: new Date().toISOString(),
  fulfillment_status: "not_fulfilled",
  payment_status: "captured",
  subtotal: 180,
  shipping_total: 0,
  tax_total: 23.48,
  discount_total: 20,
  total: 160,
  customer_id: null,
  shipping_address: {
    first_name: "MUSE",
    last_name: "Customer",
    address_1: "12 Ponsonby Road",
    address_2: "",
    city: "Auckland",
    province: "Auckland",
    postal_code: "1011",
    country_code: "nz",
    phone: "+64 21 000 000",
  },
  shipping_methods: [
    {
      name: "NZ Post Standard",
      total: 0,
    },
  ],
  payment_collections: [
    {
      payments: [
        {
          provider_id: "pp_stripe_stripe",
          data: {
            card_last4: "4242",
          },
          amount: 160,
          created_at: new Date().toISOString(),
        },
      ],
    },
  ],
  discounts: [
    {
      code: "APRIL20",
    },
  ],
  items: [
    {
      id: "ordli_preview_1",
      title: "TNF 1996 Retro Nuptse - Black",
      product_title: "TNF 1996 Retro Nuptse - Black",
      thumbnail:
        "https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png",
      quantity: 1,
      unit_price: 180,
      total: 180,
      created_at: new Date().toISOString(),
      metadata: {
        fulfillment_type: "standard",
      },
      variant: {
        title: "Black / M",
      },
    },
  ],
} as unknown as HttpTypes.StoreOrder

export default function OrderConfirmationPreviewPage() {
  return <OrderCompletedTemplate order={previewOrder} />
}
