"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Product Information",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Shipping & Returns",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="py-6 text-sm leading-6 text-black/65">
      <div className="grid gap-4">
        <div>
          <span className="font-black text-black">Fit</span>
          <p>Relaxed boxy fit. Size up if you prefer heavy layering.</p>
        </div>
        <div>
          <span className="font-black text-black">Feel</span>
          <p>Warm insulated shell with a clean winter streetwear shape.</p>
        </div>
        <div>
          <span className="font-black text-black">Best for</span>
          <p>Cold mornings, everyday wear, and simple winter fits.</p>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="py-6 text-sm leading-6 text-black/65">
      <div className="grid grid-cols-1 gap-y-6">
        <div className="flex items-start gap-x-3">
          <FastDelivery className="text-[#C1440E]" />
          <div>
            <span className="font-black text-black">Tracked delivery</span>
            <p className="max-w-sm">
              Most pre-orders arrive in 13-16 days. Tracking is emailed as
              soon as the order moves.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-3">
          <Refresh className="text-[#C1440E]" />
          <div>
            <span className="font-black text-black">30-day money back</span>
            <p className="max-w-sm">
              If the fit is not right, contact support and we will help sort
              the order.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-3">
          <Back className="text-[#C1440E]" />
          <div>
            <span className="font-black text-black">NZ Post final mile</span>
            <p className="max-w-sm">
              International Carrier handles the first leg, then NZ Post handles
              delivery once it lands in New Zealand.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
