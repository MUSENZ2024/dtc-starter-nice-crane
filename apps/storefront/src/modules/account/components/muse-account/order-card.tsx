import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BagIcon } from "./icons"
import {
  formatDate,
  formatMoney,
  getItemMeta,
  getOrderStatus,
  getPrimaryOrderItem,
} from "./helpers"

export default function MuseOrderCard({
  order,
}: {
  order: HttpTypes.StoreOrder
}) {
  const status = getOrderStatus(order)
  const item = getPrimaryOrderItem(order)

  return (
    <article className="muse-order-card p-[22px]" data-testid="order-card">
      <div className="flex flex-col gap-3 xsmall:flex-row xsmall:items-start xsmall:justify-between xsmall:gap-4">
        <div className="min-w-0">
          <div className="text-base font-black text-muse-black">
            #{order.display_id}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muse-text-light">
            {formatDate(order.created_at)}
          </div>
        </div>
        <span className={`muse-status ${status.className}`}>{status.label}</span>
      </div>

      <div className="mt-[18px] flex items-center gap-3">
        <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[10px] bg-muse-cream-deep">
          {item?.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <BagIcon className="h-6 w-6 text-muse-text-light" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate font-black text-muse-black">
            {item?.title || "MUSE order"}
          </div>
          <div className="truncate text-[13px] text-muse-text-light">
            {getItemMeta(item)}
          </div>
        </div>
      </div>

      <div className="muse-divider" />

      <div className="flex flex-col gap-4 xsmall:flex-row xsmall:items-end xsmall:justify-between">
        <div>
          <p className="muse-fine">Order total</p>
          <div className="text-lg font-black tracking-normal text-muse-black">
            {formatMoney(order.total, order.currency_code)}
          </div>
        </div>
        <LocalizedClientLink
          href={`/account/orders/details/${order.id}`}
          className="text-xs font-black uppercase tracking-[0.06em] text-muse-orange"
        >
          View order <span aria-hidden="true">→</span>
        </LocalizedClientLink>
      </div>
    </article>
  )
}
