import { retrieveCartForRender as retrieveCart } from "@lib/data/cart-for-render"
import { PRODUCT_CANDIDATE_FIELDS } from "@lib/data/product-fields"
import { listProducts } from "@lib/data/products"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import {
  getRecommendationCandidatePool,
  getRecommendedProducts,
} from "@lib/util/product-recommendations"
import { HttpTypes } from "@medusajs/types"
import CompleteTheFitCard from "./quick-add-card"
import FreeDeliveryMessage from "./free-delivery-message"

type Props = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

const FREE_SHIPPING_THRESHOLD = 200
const CANDIDATE_PAGE_SIZE = 50
const CANDIDATE_HYDRATION_LIMIT = 32
const RECOMMENDATION_INDEX_FIELDS =
  "id,title,handle,status,subtitle"

const listRecommendationIndex = async (countryCode: string) => {
  const queryParams = {
    fields: RECOMMENDATION_INDEX_FIELDS,
    limit: CANDIDATE_PAGE_SIZE,
    order: "id",
  }
  const firstPage = await listProducts({
    countryCode,
    queryParams,
    revalidateSeconds: 300,
  })
  const pageCount = Math.ceil(
    firstPage.response.count / CANDIDATE_PAGE_SIZE
  )
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      listProducts({
        countryCode,
        pageParam: index + 2,
        queryParams,
        revalidateSeconds: 300,
      }).then(({ response }) => response.products)
    )
  )

  return [firstPage.response.products, ...remainingPages].flat()
}

export default async function CompleteTheFit({ product, countryCode }: Props) {
  const [productsResponse, cart] = await Promise.all([
    listRecommendationIndex(countryCode).catch(() => []),
    retrieveCart().catch(() => null),
  ])
  const cartSubtotal = cart?.subtotal ?? 0
  const cartGap =
    cartSubtotal > 0
      ? Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal)
      : null

  const candidatePool = getRecommendationCandidatePool({
    sourceProducts: [product],
    candidates: productsResponse,
    excludeProductIds: [product.id],
    cartSubtotal,
    limit: CANDIDATE_HYDRATION_LIMIT,
  })
  const hydratedCandidates = candidatePool.length
    ? await listProducts({
        countryCode,
        queryParams: {
          fields: PRODUCT_CANDIDATE_FIELDS,
          id: candidatePool.map((candidate) => candidate.id),
          limit: CANDIDATE_HYDRATION_LIMIT,
        },
        revalidateSeconds: 300,
      })
        .then(({ response }) => response.products)
        .catch(() => [])
    : []
  const recommendations = getRecommendedProducts({
    sourceProducts: [product],
    candidates: hydratedCandidates,
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
          <p className="mt-1 max-w-[620px] text-[12px] font-medium text-[#666] small:text-[13px]">
            Selected to pair with {product.title}
          </p>
        </div>
        <FreeDeliveryMessage initialCartGap={cartGap} />
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
