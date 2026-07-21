"use client"

import { useCartDrawer } from "@lib/context/cart-drawer-context"

const FREE_SHIPPING_THRESHOLD = 200
const CLOSE_TO_FREE_SHIPPING = 70

export default function FreeDeliveryMessage({
  initialCartGap,
}: {
  initialCartGap: number | null
}) {
  const { cartSubtotal } = useCartDrawer()
  const cartGap =
    cartSubtotal === null
      ? initialCartGap
      : Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal)

  if (!cartGap || cartGap > CLOSE_TO_FREE_SHIPPING) {
    return null
  }

  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C1440E]">
      Add NZ${cartGap.toFixed(0)} for free delivery
    </p>
  )
}
