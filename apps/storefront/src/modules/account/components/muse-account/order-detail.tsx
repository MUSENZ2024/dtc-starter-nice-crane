import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BagIcon } from "./icons"
import OrderStatusBadge from "./order-status-badge"
import {
  formatDate,
  formatMoney,
  formatStatus,
  getAddressLines,
  getItemMeta,
  getOrderTracking,
  getOrderStatus,
  getPaymentDisplay,
  getPaymentStatusDisplay,
} from "./helpers"

type PaymentLike = {
  provider_id?: string
  data?: Record<string, unknown>
}

const getPayment = (order: HttpTypes.StoreOrder): PaymentLike | undefined => {
  const paymentCollections = order.payment_collections as
    | Array<{ payments?: PaymentLike[] }>
    | undefined

  return paymentCollections?.[0]?.payments?.[0]
}

export default function MuseOrderDetail({
  order,
}: {
  order: HttpTypes.StoreOrder
}) {
  const status = getOrderStatus(order)
  const payment = getPayment(order)
  const tracking = getOrderTracking(order)
  const shippingAddress = order.shipping_address
  const shippingLines = getAddressLines(shippingAddress)
  const shippingName = [shippingAddress?.first_name, shippingAddress?.last_name]
    .filter(Boolean)
    .join(" ")
  const shippingMethod = order.shipping_methods?.[0]?.name || "Shipping"

  return (
    <div data-testid="order-details-page-wrapper">
      <div className="mb-[26px] flex gap-2 text-xs text-muse-text-light">
        <span>Home</span>
        <span>/</span>
        <span>Orders</span>
        <span>/</span>
        <span>#{order.display_id}</span>
      </div>
      <div className="mb-7">
        <LocalizedClientLink href="/account/orders" className="muse-link-orange">
          ← Back to orders
        </LocalizedClientLink>
        <h1 className="muse-page-title">Order #{order.display_id}</h1>
        <p className="muse-page-sub">
          Placed {formatDate(order.created_at)} · {order.email}
        </p>
      </div>

      <div className="grid gap-[18px] small:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-[18px]">
          <div className="muse-panel">
            <div className="muse-panel-head">
              <h2 className="muse-panel-title">Items</h2>
              <OrderStatusBadge
                fallback={status}
                trackingNumbers={tracking.map((entry) => entry.number)}
              />
            </div>
            <div className="grid gap-[18px]">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[10px] bg-muse-cream-deep">
                    {item.thumbnail ? (
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
                    <div className="font-black text-muse-black">{item.title}</div>
                    {getItemMeta(item) ? (
                      <div className="text-[13px] text-muse-text-light">
                        {getItemMeta(item)}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="muse-divider" />
            <div className="grid grid-cols-1 gap-3 small:grid-cols-2">
              <KeyValue label="Fulfillment" value={formatStatus(order.fulfillment_status)} />
              <KeyValue
                label="Payment"
                value={getPaymentStatusDisplay(order.payment_status)}
              />
              <KeyValue label="Currency" value={order.currency_code.toUpperCase()} />
              <KeyValue label="Order email" value={order.email || ""} />
            </div>
          </div>

          <div className="muse-panel">
            <h2 className="muse-panel-title">Delivery</h2>
            <div className="mt-[18px] grid grid-cols-1 gap-3 small:grid-cols-2">
              <KeyValue
                label="Ship to"
                value={[shippingName, ...shippingLines].filter(Boolean).join("\n")}
                multiline
              />
              <KeyValue label="Shipping method" value={shippingMethod} />
            </div>
            {tracking.length > 0 ? (
              <div className="mt-[18px] border-t border-muse-border pt-4">
                <span className="mb-3 block text-[11px] font-black uppercase tracking-[0.1em] text-muse-text-light">
                  Tracking
                </span>
                <div className="grid gap-2">
                  {tracking.map((item) => (
                    <a
                      key={item.number}
                      href={item.url}
                      className="flex flex-col gap-1 rounded-[10px] border border-muse-border bg-muse-cream px-4 py-3 text-sm font-black text-muse-black transition hover:border-muse-black xsmall:flex-row xsmall:items-center xsmall:justify-between"
                    >
                      <span>Tracking {item.number}</span>
                      <span className="text-[11px] uppercase tracking-[0.08em] text-muse-orange">
                        {item.status || "Track order"}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid content-start gap-[18px]">
          <div className="muse-panel">
            <h2 className="muse-panel-title">Payment</h2>
            <div className="mt-[18px] grid gap-3">
              <KeyValue label="Method" value={getPaymentDisplay(payment)} />
              <KeyValue
                label="Payment"
                value={getPaymentStatusDisplay(order.payment_status)}
              />
            </div>
          </div>

          <div className="muse-panel">
            <h2 className="muse-panel-title">Totals</h2>
            <div className="mt-[18px] grid gap-2.5">
              <TotalRow label="Subtotal" value={formatMoney(order.subtotal, order.currency_code)} />
              <TotalRow label="Shipping" value={formatMoney(order.shipping_total, order.currency_code)} />
              <TotalRow label="Tax" value={formatMoney(order.tax_total, order.currency_code)} />
              <div className="mt-1 border-t border-muse-border pt-3">
                <TotalRow
                  label="Total"
                  value={formatMoney(order.total, order.currency_code)}
                  grand
                />
              </div>
            </div>
          </div>

          <LocalizedClientLink href="/account/claim-order" className="muse-btn-secondary">
            Link another order
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

function KeyValue({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="border-t border-muse-border pt-3">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.1em] text-muse-text-light">
        {label}
      </span>
      <strong className="whitespace-pre-line text-sm text-muse-black">
        {multiline ? value : value || "N/A"}
      </strong>
    </div>
  )
}

function TotalRow({
  label,
  value,
  grand = false,
}: {
  label: string
  value: string
  grand?: boolean
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        grand
          ? "text-lg font-black text-muse-black"
          : "text-sm text-muse-text-muted"
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
