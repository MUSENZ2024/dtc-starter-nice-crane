import { Heading } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  return (
    <div className="flex flex-col-reverse gap-y-8 small:flex-col">
      <div className="w-full rounded-[32px] bg-black p-5 text-white shadow-xl shadow-black/10 small:p-7">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row items-baseline text-2xl font-black tracking-[-0.04em] text-white"
        >
          Order summary
        </Heading>
        <p className="mt-2 text-sm leading-6 text-white/50">
          Secure checkout, NZD pricing, and delivery updates after dispatch.
        </p>
        <Divider className="my-6 bg-white/10" />
        <div className="rounded-[24px] bg-white p-4 text-black">
          <CartTotals totals={cart} />
        </div>
        <ItemsPreviewTemplate cart={cart} />
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>
        <div className="rounded-[22px] bg-white/10 p-4 text-xs leading-5 text-white/55">
          Most pre-orders arrive in 13-16 days. Tracking is emailed as soon as
          your order moves.
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
