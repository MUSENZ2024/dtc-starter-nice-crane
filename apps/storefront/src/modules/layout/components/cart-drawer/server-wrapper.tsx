import { retrieveCart } from "@lib/data/cart"
import { listProducts } from "@lib/data/products"
import { getRecommendedProducts } from "@lib/util/product-recommendations"
import { HttpTypes } from "@medusajs/types"
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
        queryParams: { limit: 48 },
      })
        .then(({ response }) => {
          const productsById = new Map(
            response.products.map((product) => [product.id, product])
          )
          const sourceProducts =
            cart.items
              ?.map((item) => {
                if (item.product_id && productsById.has(item.product_id)) {
                  return productsById.get(item.product_id)
                }

                return (item.product ??
                  item.variant?.product) as HttpTypes.StoreProduct | undefined
              })
              .filter(
                (product): product is HttpTypes.StoreProduct => Boolean(product)
              ) ?? []

          return getRecommendedProducts({
            sourceProducts,
            candidates: response.products,
            excludeProductIds: cartProductIds,
            cartSubtotal: cart.subtotal ?? cart.item_subtotal ?? 0,
            limit: 2,
          })
        })
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
