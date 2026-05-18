import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C1440E] hover:text-black"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-4xl font-black leading-[0.95] tracking-[-0.05em] text-black small:text-5xl"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <Text
          className="text-base leading-7 text-black/60 whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description ||
            "A warm, everyday puffer with a boxy retro fit, durable shell, and easy layering weight. Built for cold mornings, late-night missions, and clean winter fits."}
        </Text>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {["Inspected dispatch", "NZ Post tracking", "30-day money back", "Auckland pickup"].map((item) => (
            <div key={item} className="rounded-full bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-black/65">
              {item}
            </div>
          ))}
        </div>
        <div className="rounded-[22px] bg-[#FDF4EF] p-4 text-sm leading-6 text-black/70">
          <strong className="text-[#C1440E]">Pre-order note:</strong> most orders
          land in 13-16 days. You will get tracking as soon as the order moves.
        </div>
      </div>
    </div>
  )
}

export default ProductInfo
