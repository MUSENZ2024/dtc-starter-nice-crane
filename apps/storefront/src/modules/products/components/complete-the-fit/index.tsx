import { retrieveCart } from "@lib/data/cart"
import { listProducts } from "@lib/data/products"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getRecommendedProducts } from "@lib/util/product-recommendations"
import { HttpTypes } from "@medusajs/types"
import CompleteTheFitCard from "./quick-add-card"

type Props = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

const FREE_SHIPPING_THRESHOLD = 200
const CLOSE_TO_FREE_SHIPPING = 70

export default async function CompleteTheFit({ product, countryCode }: Props) {
  const [productsResponse, cart] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: { limit: 48 },
    }).catch(() => null),
    retrieveCart().catch(() => null),
  ])
  const cartSubtotal = cart?.subtotal ?? 0
  const cartGap =
    cartSubtotal > 0
      ? Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal)
      : null

  const recommendations = getRecommendedProducts({
    sourceProducts: [product],
    candidates: productsResponse?.response.products ?? [],
    excludeProductIds: [product.id],
    cartSubtotal,
    limit: 4,
  })

  if (!recommendations.length) {
    return null
  }

  return (
    <section className="mx-auto max-w-[1320px] px-[18px] pt-6 small:px-8">
      <div className="mb-6 flex flex-col gap-2 small:flex-row small:items-end small:justify-between">
        <div>
          <h2 className="text-[24px] font-black tracking-[-0.03em] small:text-[34px]">
            Complete the fit
          </h2>
        </div>
        {cartGap && cartGap > 0 && cartGap <= CLOSE_TO_FREE_SHIPPING ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C1440E]">
            Add NZ${cartGap.toFixed(0)} for free delivery
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2.5 small:grid-cols-4 small:gap-4">
        {recommendations.map((recommendation, index) => (
          <CompleteTheFitCard
            key={recommendation.id}
            product={recommendation}
            countryCode={countryCode}
            deliveryLabel={getFulfilmentState(recommendation).deliveryLabel}
            priority={index < 2}
          />
        ))}
      </div>
    </section>
  )
}
