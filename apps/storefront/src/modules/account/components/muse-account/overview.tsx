import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MuseOrderCard from "./order-card"
import { BagIcon } from "./icons"
import { getCustomerName, getProfileCompletion } from "./helpers"

export default function MuseOverview({
  customer,
  orders,
  countryCode,
}: {
  customer: HttpTypes.StoreCustomer
  orders: HttpTypes.StoreOrder[]
  countryCode: string
}) {
  const recentOrders = orders.slice(0, 3)
  const firstName = customer.first_name || getCustomerName(customer)
  const completion = getProfileCompletion(customer)

  return (
    <div data-testid="overview-page-wrapper">
      <div className="mb-[26px] flex gap-2 text-xs text-muse-text-light">
        <span>Home</span>
        <span>/</span>
        <span>Overview</span>
      </div>
      <div className="mb-7">
        <h1 className="muse-page-title">Hey, {firstName}</h1>
        <p className="muse-page-sub">
          Here is what is happening with your MUSE account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 small:grid-cols-3">
        <div className="muse-stat-card">
          <div className="muse-stat-label">Total orders</div>
          <div className="muse-stat-number">{orders.length}</div>
          <p className="muse-fine mt-2">All time</p>
        </div>
        <div className="muse-stat-card">
          <div className="muse-stat-label">Saved addresses</div>
          <div className="muse-stat-number">{customer.addresses?.length || 0}</div>
          <p className="muse-fine mt-2">Delivery ready</p>
        </div>
        <div className="muse-stat-card">
          <div className="muse-stat-label">Profile completion</div>
          <div className="muse-stat-number">{completion}%</div>
          <p className="muse-fine mt-2">Name, phone, and default shipping saved</p>
        </div>
      </div>

      <div className="mt-7 grid gap-[22px]">
        <div className="muse-panel">
          <div className="muse-panel-head">
            <h2 className="muse-panel-title">
              <BagIcon />
              Recent orders
            </h2>
            <LocalizedClientLink
              href="/account/orders"
              className="text-xs font-black uppercase tracking-[0.06em] text-muse-orange"
            >
              View all
            </LocalizedClientLink>
          </div>
          {recentOrders.length ? (
            <div className="grid gap-4">
              {recentOrders.map((order) => (
                <MuseOrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-muse-border bg-muse-cream-warm p-5">
              <p className="text-sm font-semibold text-muse-black">
                No recent orders yet.
              </p>
              <p className="mt-1 text-sm text-muse-text-muted">
                When you place an order, real order details will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
