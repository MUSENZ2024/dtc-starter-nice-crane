import { getBostonColours } from "@lib/data/boston"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"

export const metadata: Metadata = {
  title: { absolute: "Birkenstock Boston | All Colours | MUSE NZ" },
  description: "Explore Boston colours and finishes at MUSE NZ. Compare available sizes, NZD prices and tracked delivery options.",
  robots: { index: false, follow: false },
}


export default async function BostonPage({ params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)
  if (!region) notFound()
  const bostonColours = await getBostonColours(countryCode)
  const product = bostonColours.find((colour) => colour.label === "Taupe")?.product ?? bostonColours.find((colour) => colour.product)?.product
  if (!product) notFound()
  return <ProductTemplate product={product} region={region} countryCode={countryCode} images={product.images ?? []} bostonColours={bostonColours} />
}
