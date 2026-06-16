import React from "react"

import { HttpTypes } from "@medusajs/types"
import MuseAccountSidebar from "../components/muse-account/sidebar"
import MuseSignOutAction from "../components/muse-account/signout-action"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  const orderCount =
    (customer as (HttpTypes.StoreCustomer & { orders?: unknown[] }) | null)
      ?.orders?.length ?? 0

  return (
    <div className="min-h-screen bg-muse-cream" data-testid="account-page">
      <div className={customer ? "muse-account-layout" : ""}>
        {customer && (
          <MuseAccountSidebar customer={customer} orderCount={orderCount} />
        )}
        <div className="min-w-0 flex-1">
          {children}
          {customer && <MuseSignOutAction />}
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
