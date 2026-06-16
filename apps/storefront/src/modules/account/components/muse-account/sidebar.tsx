"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, usePathname } from "next/navigation"
import {
  BagIcon,
  GridIcon,
  MapPinIcon,
  TransferIcon,
  UserIcon,
} from "./icons"
import { getAvatarLetter, getCustomerName } from "./helpers"

type Props = {
  customer: HttpTypes.StoreCustomer | null
  orderCount: number
}

const items = [
  { href: "/account", label: "Overview", match: "overview", icon: GridIcon },
  { href: "/account/orders", label: "Orders", match: "orders", icon: BagIcon },
  {
    href: "/account/addresses",
    label: "Addresses",
    match: "addresses",
    icon: MapPinIcon,
  },
  { href: "/account/profile", label: "Profile", match: "profile", icon: UserIcon },
  {
    href: "/account/claim-order",
    label: "Link order",
    match: "claim-order",
    icon: TransferIcon,
  },
]

export default function MuseAccountSidebar({ customer, orderCount }: Props) {
  const pathname = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const activePath = pathname.split(`/${countryCode}`)[1] || "/account"
  const activeMatch =
    activePath === "/account"
      ? "overview"
      : activePath.includes("/orders")
      ? "orders"
      : activePath.includes("/addresses")
      ? "addresses"
      : activePath.includes("/profile")
      ? "profile"
      : activePath.includes("/claim-order")
      ? "claim-order"
      : "overview"

  return (
    <aside className="muse-account-sidebar" aria-label="Account navigation">
      <div className="muse-profile-card">
        <div className="muse-avatar">{getAvatarLetter(customer)}</div>
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-black leading-tight small:text-[17px]">
            {getCustomerName(customer)}
          </h3>
          <p className="truncate text-[13px] text-[#8D8D8D]">
            {customer?.email}
          </p>
        </div>
        <span className="muse-member-pill">Member</span>
      </div>

      <nav className="muse-account-menu" aria-label="Account sections">
        {items.map(({ href, label, match, icon: Icon }) => {
          const isActive = activeMatch === match

          return (
            <LocalizedClientLink
              key={label}
              href={href}
              className={`muse-account-link ${
                isActive ? "muse-account-link-active" : ""
              }`}
            >
              <Icon />
              <span className="muse-account-link-label">{label}</span>
              {label === "Orders" && <span className="muse-badge">{orderCount}</span>}
            </LocalizedClientLink>
          )
        })}
      </nav>
    </aside>
  )
}
