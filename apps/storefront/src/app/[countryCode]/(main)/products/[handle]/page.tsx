import { Metadata } from "next"
import { notFound } from "next/navigation"
import { PRODUCT_DETAIL_FIELDS } from "@lib/data/product-fields"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { getBaseURL } from "@lib/util/env"
import { getProductPrice } from "@lib/util/get-product-price"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle, fields: PRODUCT_DETAIL_FIELDS },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | MUSE NZ`,
    description:
      product.description ||
      `Shop ${product.title} at MUSE NZ with tracked New Zealand delivery.`,
    alternates: {
      canonical: `/${params.countryCode}/products/${handle}`,
    },
    openGraph: {
      title: `${product.title} | MUSE NZ`,
      description:
        product.description ||
        `Shop ${product.title} at MUSE NZ with tracked New Zealand delivery.`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle, fields: PRODUCT_DETAIL_FIELDS },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)
  const galleryImages = images?.length
    ? images
    : pricedProduct.thumbnail
      ? [
          {
            id: `${pricedProduct.id}-thumbnail`,
            url: pricedProduct.thumbnail,
            rank: 0,
          },
        ]
      : []
  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const inStock =
    pricedProduct.variants?.some(
      (variant) =>
        !variant.manage_inventory ||
        variant.allow_backorder ||
        (variant.inventory_quantity ?? 0) > 0
    ) ?? false
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pricedProduct.title,
    description: pricedProduct.description || pricedProduct.title,
    image: pricedProduct.images?.map((image) => image.url).filter(Boolean),
    sku: pricedProduct.variants?.[0]?.sku || pricedProduct.id,
    url: `${getBaseURL()}/${params.countryCode}/products/${params.handle}`,
    offers: cheapestPrice
      ? {
          "@type": "Offer",
          price: cheapestPrice.calculated_price_number,
          priceCurrency: cheapestPrice.currency_code.toUpperCase(),
          availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
          url: `${getBaseURL()}/${params.countryCode}/products/${params.handle}`,
        }
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={galleryImages}
      />
    </>
  )
}
