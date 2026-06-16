import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listProducts } from "@lib/data/products"
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

  const firstCategoryId = cart?.items?.[0]?.variant?.product?.categories?.[0]?.id
  const cartProductIds = new Set(
    cart?.items?.map((item) => item.product_id).filter(Boolean)
  )

  const addonProducts = cart?.items?.length
    ? await listProducts({
        countryCode,
        queryParams: {
          limit: 6,
          ...(firstCategoryId ? { category_id: [firstCategoryId] } : {}),
        },
      })
        .then(({ response }) =>
          response.products
            .filter((product) => !cartProductIds.has(product.id))
            .slice(0, 2)
        )
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
