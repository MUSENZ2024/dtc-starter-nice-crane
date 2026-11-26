import "server-only"
import { cache } from "react"
import localImages from "@modules/products/data/boston-images.json"
import { listProducts } from "@lib/data/products"
import { PRODUCT_DETAIL_FIELDS } from "@lib/data/product-fields"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import type { HttpTypes } from "@medusajs/types"

export const BOSTON_COLOURS = [
  { label: "Leather mocha", swatch: "#644735", handle: "birkenstock-boston-soft-footbed-leather-mocha" },
  { label: "Mocha", swatch: "#76604C", handle: "birkenstock-boston-soft-footbed-suede-mocha" },
  { label: "Black", swatch: "#252525", handle: "birkenstock-boston-black" },
  { label: "Faded khaki", swatch: "#B4AD8C", handle: "birkenstock-boston-soft-footbed-suede-faded-khaki" },
  { label: "Olive", swatch: "#777B51", handle: "birkenstock-boston-olive" },
  { label: "Oiled leather", swatch: "#37322E", handle: "birkenstock-boston-oiled-leather-black" },
  { label: "Pink", swatch: "#D8AFAC", handle: "birkenstock-boston-pink" },
  { label: "Taupe", swatch: "#B4A590", handle: "birkenstock-boston-soft-footbed-suede-taupe" },
  { label: "Sand", swatch: "#D0BE98", handle: "birkenstock-boston-soft-footbed-suede-sand" },
]


export function isStandardBoston(product: HttpTypes.StoreProduct) {
  return BOSTON_COLOURS.some(colour => colour.handle === product.handle)
    && getFulfilmentState(product).kind === "standard-delivery"
}

export const getBostonColours = cache(async (countryCode: string) => {
  const { response } = await listProducts({ countryCode, queryParams: { handle: BOSTON_COLOURS.map((colour) => colour.handle), limit: BOSTON_COLOURS.length, fields: `${PRODUCT_DETAIL_FIELDS.replace(",*variants.images", "")},+variants.title` } })
  return BOSTON_COLOURS.map((colour) => ({ ...colour, product: (() => {
    const product = response.products.find((product) => product.handle === colour.handle && getFulfilmentState(product).kind === "standard-delivery")
    if (!product) return undefined
    const imageMap = localImages as Record<string, string>
    return { ...product, images: product.images?.map((image) => ({ ...image, url: imageMap[image.url] ?? image.url })) ?? null, thumbnail: product.thumbnail ? imageMap[product.thumbnail] ?? product.thumbnail : product.thumbnail, description: /taupe/i.test(product.description ?? "") && !/taupe/i.test(product.title) ? `${product.title}. Adjustable buckle strap and closed-toe clog shape. Select an available EU size and check the delivery information before ordering.` : product.description }
  })() }))
})
