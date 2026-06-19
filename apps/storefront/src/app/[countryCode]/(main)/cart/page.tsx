import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listProducts } from "@lib/data/products"
import { getRecommendedProducts } from "@lib/util/product-recommendations"
import { HttpTypes } from "@medusajs/types"
import CartTemplateMuse from "@modules/cart/templates/cart-template-muse"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your Bag - MUSE NZ",
  description:
    "View your bag, update quantities, and go to checkout. Free NZ delivery over $200.",
}

type CartPageProps = {
  params: Promise<{
    countryCode: string
  }>
}

const CART_FIELDS =
  "*items,*items.product,*items.product.collection,*items.product.categories,*items.product.metadata,*items.variant,*items.variant.options,*items.thumbnail,*items.metadata,+items.total,*region,*promotions,+shipping_methods.name,+subtotal,+shipping_total,+tax_total,+total,+currency_code"

export default async function Cart(props: CartPageProps) {
  const { countryCode } = await props.params

  const [cart, customer] = await Promise.all([
    retrieveCart(undefined, CART_FIELDS).catch((error) => {
      console.error(error)
      return null
    }),
    retrieveCustomer().catch(() => null),
  ])

  const cartProductIds = new Set(
    cart?.items?.map((item) => item.product_id).filter(Boolean)
  )

  const addonProducts = cart?.items?.length
    ? await listProducts({
        countryCode,
        queryParams: {
          limit: 48,
        },
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
    <CartTemplateMuse
      cart={cart}
      customer={customer}
      addonProducts={addonProducts}
    />
  )
}
