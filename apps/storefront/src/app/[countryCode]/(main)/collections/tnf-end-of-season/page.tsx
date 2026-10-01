import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { PRODUCT_DETAIL_FIELDS } from "@lib/data/product-fields"
import ProductTemplate from "@modules/products/templates"
import MetaViewContentTracker from "@modules/analytics/components/meta-view-content-tracker"
import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductPrice } from "@lib/util/get-product-price"

const FEATURED_HANDLE = "nuptse-jacket-black"
const OTHER_ITEM_HANDLES = [
  "nuptse-vest-navy",
  "nuptse-jacket-brown",
  "nuptse-vest-black",
  "nuptse-jacket-white-black",
  "nuptse-jacket-cream-white",
  "nuptse-jacket-blue",
] as const

export const metadata: Metadata = {
  title: "The North Face End of Season Sale",
  description:
    "Shop the black 1996 Retro Nuptse Jacket, then view other end of season Nuptse jackets and vests at MUSE NZ.",
  alternates: { canonical: "/collections/tnf-end-of-season" },
  openGraph: {
    title: "The North Face End of Season Sale | MUSE NZ",
    description:
      "Shop the black Nuptse Jacket and browse other end of season colours and vests.",
    images: ["/campaigns/tnf-end-of-season/hero.jpg"],
  },
}

export default async function TnfEndOfSeasonPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) notFound()

  const handles = [FEATURED_HANDLE, ...OTHER_ITEM_HANDLES]
  const { response } = await listProducts({
    countryCode,
    queryParams: {
      handle: [...handles],
      limit: handles.length,
      fields: PRODUCT_DETAIL_FIELDS,
    },
  })
  const productByHandle = new Map(
    response.products.map((product) => [product.handle, product])
  )
  const product = productByHandle.get(FEATURED_HANDLE)

  if (!product) notFound()

  const campaignProducts = OTHER_ITEM_HANDLES.map((handle) =>
    productByHandle.get(handle)
  ).filter((item): item is HttpTypes.StoreProduct => Boolean(item))

  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [{ id: `${product.id}-thumbnail`, url: product.thumbnail, rank: 0 }]
      : []
  const featuredPrice = getProductPrice({ product }).cheapestPrice

  return (
    <>
      <MetaViewContentTracker
        contentId={product.id}
        contentName={product.title}
        currency={featuredPrice?.currency_code ?? region.currency_code ?? "nzd"}
        value={featuredPrice?.calculated_price_number ?? 0}
      />
      <ProductTemplate
        product={product}
        region={region}
        countryCode={countryCode}
        images={images}
        campaignProducts={campaignProducts}
      />
    </>
  )
}
