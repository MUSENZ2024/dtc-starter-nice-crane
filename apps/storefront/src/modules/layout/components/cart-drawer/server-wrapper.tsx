import { retrieveCart } from "@lib/data/cart"
import { listProducts } from "@lib/data/products"
import CartDrawer from "./index"

export default async function CartDrawerWrapper() {
  const cart = await retrieveCart().catch(() => null)
  const countryCode =
    cart?.shipping_address?.country_code ??
    cart?.region?.countries?.[0]?.iso_2 ??
    "nz"
  const cartProductIds = new Set(
    cart?.items?.map((item) => item.product_id).filter(Boolean)
  )
  const addonProducts = cart?.items?.length
    ? await listProducts({
        countryCode,
        queryParams: { limit: 6 },
      })
        .then(({ response }) =>
          response.products
            .filter((product) => !cartProductIds.has(product.id))
            .slice(0, 2)
        )
        .catch(() => [])
    : []

  return (
    <CartDrawer
      cart={cart}
      addonProducts={addonProducts}
      countryCode={countryCode}
    />
  )
}
