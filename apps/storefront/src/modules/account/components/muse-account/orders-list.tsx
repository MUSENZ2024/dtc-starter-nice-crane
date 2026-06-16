import { HttpTypes } from "@medusajs/types"
import MuseOrderCard from "./order-card"

export default function MuseOrdersList({
  orders,
}: {
  orders: HttpTypes.StoreOrder[]
}) {
  return (
    <div data-testid="orders-page-wrapper">
      <div className="mb-[26px] flex gap-2 text-xs text-muse-text-light">
        <span>Home</span>
        <span>/</span>
        <span>Orders</span>
      </div>
      <div className="mb-7">
        <h1 className="muse-page-title">Orders</h1>
        <p className="muse-page-sub">
          Your order history and current fulfillment status.
        </p>
      </div>

      {orders.length ? (
        <div className="grid gap-4">
          {orders.map((order) => (
            <MuseOrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="muse-panel">
          <p className="text-sm font-semibold text-muse-black">
            No orders are linked to this account yet.
          </p>
          <p className="mt-1 text-sm text-muse-text-muted">
            Bought before signing in? Use Link order when you have a code from
            your email.
          </p>
        </div>
      )}
    </div>
  )
}
