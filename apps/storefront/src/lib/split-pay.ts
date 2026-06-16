import { HttpTypes } from "@medusajs/types"

export const SPLIT_PAY_INSTALLMENTS = 4

export function getCartTotalCents(cart: HttpTypes.StoreCart) {
  return Math.round((cart.total ?? 0) * 100)
}

export function getSplitPayInstallments(totalCents: number) {
  const baseCents = Math.floor(totalCents / SPLIT_PAY_INSTALLMENTS)
  const remainderCents = totalCents % SPLIT_PAY_INSTALLMENTS
  const installments = Array.from(
    { length: SPLIT_PAY_INSTALLMENTS },
    (_, index) => baseCents + (index < remainderCents ? 1 : 0)
  )

  return {
    baseCents: installments[0] ?? 0,
    finalCents: installments[installments.length - 1] ?? 0,
    installments,
  }
}

export function formatSplitPayMoney(cents: number, currency = "nzd") {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
  }).format(cents / 100)
}
