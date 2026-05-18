import { HttpTypes } from "@medusajs/types"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

const placeholders = [
  {
    title: "9060 Style Runner - Sea Salt",
    price: "NZ$160",
    badge: "Pre-order",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Retro Puffer Vest - Navy",
    price: "NZ$145",
    badge: "Winter drop",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Everyday Court Sneaker - Grey",
    price: "NZ$150",
    badge: "On hand",
    image:
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "1996 Retro Puffer Jacket - Navy",
    price: "NZ$180",
    badge: "Coming soon",
    image:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=85",
  },
]

export default function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const shopHref = `/${countryCode}/store`

  return (
    <div>
      <div className="mb-10 flex flex-col gap-3 text-center small:items-center">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
          Complete the fit
        </p>
        <h2 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.06em] small:text-6xl">
          Buyers usually check these next.
        </h2>
        <p className="max-w-xl text-sm leading-6 text-black/55">
          Placeholder cards for now. Once the real catalogue is imported, this
          section can pull related pieces by category, tag, or collection.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-4 small:grid-cols-4">
        {placeholders.map((item) => (
          <li key={item.title}>
            <a
              href={shopHref}
              className="group block overflow-hidden rounded-[28px] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#E8E3D6]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-black backdrop-blur">
                  {item.badge}
                </div>
              </div>
              <div className="p-4">
                <p className="min-h-[40px] text-sm font-black leading-5 tracking-[-0.02em]">
                  {item.title}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-base font-black text-[#C1440E]">
                    {item.price}
                  </p>
                  <span className="rounded-full bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                    View
                  </span>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
