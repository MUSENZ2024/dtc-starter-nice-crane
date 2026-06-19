import React from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import RecentlyViewedProducts from "@modules/products/components/recently-viewed-products"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"
import CompleteTheFit from "@modules/products/components/complete-the-fit"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const photoReviews = [
  { image: "/review-photos/review-50.webp", name: "Aaliyah N.", date: "5 Jun 2026", text: "Delivery took a bit, but customer service was mint with every question. Happy as." },
  { image: "/review-photos/review-66.webp", name: "Priya S.", date: "2 Jun 2026", text: "I had to message for updates instead of getting them automatically. Product itself was alright." },
  { image: "/review-photos/review-73.jpeg", name: "Kauri B", date: "1 Jun 2026", text: "The quality is top tier and shoes are brand new. They shipped in 2 days and it came a few days later. Communication was bad but I still received my package and it was not damaged. The shoes are literally brand new and have no scruffs marks. Honestly 8/10 would recommend this seller" },
  { image: "/review-photos/review-46.webp", name: "Noah W.", date: "28 May 2026", text: "Messaged about sizing and got a proper helpful reply. Cheers." },
  { image: "/review-photos/review-65.webp", name: "Sophie W.", date: "21 May 2026", text: "Not bad, but not amazing either. Delivery was slow and I expected slightly better packaging" },
  { image: "/review-photos/review-69.webp", name: "Talia V.", date: "21 May 2026", text: "Tracking was quiet for a few days, which was annoying, but customer service explained it properly." },
  { image: "/review-photos/review-52.webp", name: "Matiu H", date: "18 May 2026", text: "Took the full delivery time, but they replied fast and kept me in the loop." },
  { image: "/review-photos/review-45.webp", name: "Chloe B", date: "6 May 2026", text: "Love them heaps, already had a few mates ask where from." },
  { image: "/review-photos/review-49.webp", name: "Talia F", date: "6 May 2026", text: "Wait was longer than usual, but updates were clear and the shoes were worth it." },
  { image: "/review-photos/review-51.webp", name: "Grace H", date: "6 May 2026", text: "Bit of a wait, no dramas though. They answered everything properly. Stoked overall" },
  { image: "/review-photos/review-44.webp", name: "Sophie L", date: "21 Apr 2026", text: "Came packed nicely, no dramas. Happy as with the quality." },
  { image: "/review-photos/review-64.webp", name: "Sam L", date: "8 Apr 2026", text: "Tracking was confusing and didn’t update for ages. Made the whole order feel a bit stressful." },
  { image: "/review-photos/review-43.webp", name: "Arjun P", date: "15 Mar 2026", text: "Honestly pretty chuffed. Sizing was bang on and they look clean." },
  { image: "/review-photos/review-01.jpg", name: "Jayden R", date: "14 Mar 2026", text: "Got these today, quality is actually crazy good. Way nicer in hand than I expected." },
  { image: "/review-photos/review-02.webp", name: "Zach T", date: "9 Mar 2026", text: "Quality is actually really solid, suede feels nice and soft. Happy with these." },
  { image: "/review-photos/review-03.webp", name: "Connor W", date: "2 Mar 2026", text: "Worn them out once already and they still look great. Really happy with them." },
  { image: "/review-photos/review-38.webp", name: "Wiremu K", date: "27 Feb 2026", text: "Comfy, clean, and packaged well. Would definitely order again." },
  { image: "/review-photos/review-53.webp", name: "Luke B", date: "27 Feb 2026", text: "Was worried about timing, but they replied quickly and the jacket arrived mint." },
  { image: "/review-photos/review-67.webp", name: "Arjun P.", date: "27 Feb 2026", text: "I usually wear US 8 and ordered US 8. Fit was true to size and looked just like the photos." },
  { image: "/review-photos/review-04.jpg", name: "Sophie L", date: "26 Feb 2026", text: "Honestly feels like retail, even the puff and shape is on point." },
  { image: "/review-photos/review-05.webp", name: "Liam K", date: "22 Feb 2026", text: "Been using them daily, holding up well so far. No complaints." },
  { image: "/review-photos/review-06.webp", name: "Jay M", date: "18 Feb 2026", text: "Suede came in nice condition, just brushed them lightly and they look perfect." },
  { image: "/review-photos/review-07.webp", name: "Ethan P", date: "10 Feb 2026", text: "Only thing is they run slightly snug for me, but overall still really happy." },
  { image: "/review-photos/review-08.webp", name: "Chloe N", date: "5 Feb 2026", text: "Didn’t think I’d be a Birks person but yeah… these changed my mind 😂" },
  { image: "/review-photos/review-09.webp", name: "Ryan D", date: "30 Jan 2026", text: "Came exactly like the pics. Colour is proper nice in person." },
  { image: "/review-photos/review-10.webp", name: "Hannah S", date: "24 Jan 2026", text: "Footbed feels proper supportive, can tell they’ll get even better with wear." },
  { image: "/review-photos/review-11.webp", name: "Josh B", date: "18 Jan 2026", text: "Box came in mint condition, everything proper tidy. Stoked with it." },
  { image: "/review-photos/review-37.webp", name: "Grace G", date: "16 Jan 2026", text: "Was a bit unsure at first, but honestly stoked once they arrived." },
  { image: "/review-photos/review-12.webp", name: "Levi C", date: "12 Jan 2026", text: "Was a bit iffy ordering at first but nah these are mean 🔥" },
  { image: "/review-photos/review-13.webp", name: "Tyler F", date: "6 Jan 2026", text: "Been wearing them non stop, footbed already starting to shape to my foot. Comfy as." },
  { image: "/review-photos/review-14.webp", name: "Olivia G", date: "28 Dec 2025", text: "Delivery took a couple extra days but quality is proper aye, worth the wait." },
  { image: "/review-photos/review-15.webp", name: "Noah H", date: "20 Dec 2025", text: "They look even better in person tbh, super happy with them" },
  { image: "/review-photos/review-16.jpg", name: "Mason J", date: "14 Dec 2025", text: "Nice bag" },
  { image: "/review-photos/review-17.webp", name: "Emily A", date: "7 Dec 2025", text: "Was kinda nervous ordering but they’re sooo nice. Might’ve sized up tbh but still comfy." },
  { image: "/review-photos/review-18.webp", name: "Sophl V", date: "30 Nov 2025", text: "So happy with these!! delivery was pretty quick too, thank youuu 🫶" },
  { image: "/review-photos/review-19.webp", name: "Daniel P", date: "22 Nov 2025", text: "Delivery was a bit slow but product is solid so can’t complain" },
  { image: "/review-photos/review-20.webp", name: "Alexia E", date: "15 Nov 2025", text: "Got them today, box was a tiny bit scuffed but shoes are mint so not too bothered. Cheers bro." },
  { image: "/review-photos/review-56.webp", name: "Maya K", date: "8 Nov 2025", text: "Good experience overall. I had a few questions before ordering and they were answered properly, not just quick one-word replies. The product came tidy and I’d order again." },
  { image: "/review-photos/review-21.webp", name: "Ella R", date: "7 Nov 2025", text: "Colour is even nicer in real life, goes with everything I wear" },
  { image: "/review-photos/review-22.webp", name: "Ben T", date: "30 Oct 2025", text: "Took a few days to break in but sweet now. Quality is solid." },
  { image: "/review-photos/review-23.jpg", name: "Zoe K", date: "24 Oct 2025", text: "Obsessed with this 😭 fits sooo nice. Would maybe go up a size if you want it baggy though" },
  { image: "/review-photos/review-24.webp", name: "Aria W", date: "18 Oct 2025", text: "Perfect neutral colour, matches literally everything I own" },
  { image: "/review-photos/review-25.webp", name: "Sam D", date: "11 Oct 2025", text: "shoes were perfect so no stress" },
  { image: "/review-photos/review-26.jpg", name: "Luke S", date: "6 Oct 2025", text: "Perfect everyday jacket, goes with everything. So glad I got this one" },
  { image: "/review-photos/review-63.webp", name: "Mia R", date: "5 Oct 2025", text: "The box arrived pretty crushed, which wasn’t ideal. Shoes were fine inside, but presentation could be better." },
  { image: "/review-photos/review-27.jpg", name: "Tiana M", date: "30 Sep 2025", text: "Jacket is proper warm aye, been wearing it every night. Zips a bit stiff at first but all good now." },
  { image: "/review-photos/review-28.jpg", name: "Josh N", date: "22 Sep 2025", text: "Feels super puffy and warm, literally perfect for this weather" },
  { image: "/review-photos/review-29.jpg", name: "Maddie F", date: "14 Sep 2025", text: "Came a day late but quality is mean so can’t really complain." },
  { image: "/review-photos/review-30.webp", name: "Kieran P", date: "5 Sep 2025", text: "Not too heavy which I rate, still keeps me warm as. Good pickup." },
  { image: "/review-photos/review-31.png", name: "Bella T", date: "29 Aug 2025", text: "Wait these are actually so cute in person 😭 fit is perfect too, I’m obsessed" },
  { image: "/review-photos/review-32.png", name: "Jordan H", date: "20 Aug 2025", text: "Chucked them on straight away, comfy as. Will defs be back for another pair." },
  { image: "/review-photos/review-62.webp", name: "Jordan T", date: "16 Aug 2025", text: "Took too long for me personally. Quality was decent, but I probably wouldn’t order if I needed something fast." },
  { image: "/review-photos/review-68.webp", name: "Leilani K.", date: "16 Aug 2025", text: "I normally buy women’s sizing and sized down like suggested. Jacket fit was spot on" },
  { image: "/review-photos/review-33.png", name: "Sienna L", date: "12 Aug 2025", text: "Love ittt, been getting compliments already 🫶" },
  { image: "/review-photos/review-47.webp", name: "Mason D", date: "3 Jul 2025", text: "Took the expected time, but all good. Worth it when they arrived." },
  { image: "/review-photos/review-61.webp", name: "Olivia K.", date: "30 Jun 2025", text: "Customer service replied eventually, but I had to follow up twice. Product was okay once it arrived." },
  { image: "/review-photos/review-70.webp", name: "Moana L", date: "30 Jun 2025", text: "I had wide feet and asked first. They recommended sizing up, which ended up being right." },
  { image: "/review-photos/review-60.webp", name: "Lucas A", date: "11 May 2025", text: "Good honest experience. Delivery took a bit, but the product came exactly as expected. Support replied quickly and made the whole process feel easy." },
  { image: "/review-photos/review-59.webp", name: "Meera J", date: "24 Apr 2025", text: "Delivery took longer than I expected and tracking barely updated. Product was fine, but the wait was annoying" },
  { image: "/review-photos/review-71.jpeg", name: "Tane W", date: "24 Apr 2025", text: "I ordered my usual size and they felt slightly snug at first, but comfy after wearing" },
  { image: "/review-photos/review-58.webp", name: "Mason D", date: "9 Feb 2025", text: "Wasn’t the fastest delivery, but I knew that before ordering. Communication was good the whole way and I’m really happy with the final product." },
  { image: "/review-photos/review-72.webp", name: "Anahera S.", date: "18 Jan 2025", text: "Not the fastest delivery, but the updates were honest and the quality was better than expected" },
  { image: "/review-photos/review-36.webp", name: "Moana L", date: "9 Jan 2025", text: "Really happy with these, sizing was accurate and they go with everything." },
  { image: "/review-photos/review-42.webp", name: "Ruby A", date: "17 Nov 2024", text: "Wasn’t sure at first, but they’re actually mint in person." },
  { image: "/review-photos/review-40.webp", name: "Talia M", date: "4 Oct 2024", text: "Mean as, shoes looked mint and tracking came through sweet." },
  { image: "/review-photos/review-41.webp", name: "Mason K.", date: "13 Jul 2024", text: "Stoked with these, comfy fit and turned up all good." },
  { image: "/review-photos/review-35.webp", name: "Rangi C.", date: "22 May 2024", text: "Good quality for the price. Arrived quicker than I expected too." },
  { image: "/review-photos/review-39.webp", name: "Ethan W.", date: "22 May 2024", text: "Solid pair, no issues at all. I would size up tho" },
  { image: "/review-photos/review-55.webp", name: "Anika S", date: "7 Apr 2024", text: "First time ordering from Muse and I was honestly a bit unsure, but everything went smooth. The shoes came well packed, sizing was right, and customer service was really helpful." },
  { image: "/review-photos/review-54.webp", name: "Ella M", date: "18 Mar 2024", text: "Really happy with my order. Delivery took a little while, but the team replied quickly whenever I asked for an update. Product arrived looking exactly like the photos, so I was happy as." },
  { image: "/review-photos/review-34.webp", name: "Jess M", date: "14 Mar 2024", text: "Super easy order, tracking was clear and the shoes looked mint in person." },
  { image: "/review-photos/review-48.webp", name: "Meera J", date: "18 Feb 2024", text: "Got these for my partner and they were stoked. Easy win." },
  { image: "/review-photos/review-57.webp", name: "Chloe B.", date: "12 Feb 2024", text: "Ordered a jacket and it fits really nicely. Warm without being too bulky, and the sizing advice was helpful. Took the stated delivery time, but all good." },
]

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode: _countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const { cheapestPrice } = getProductPrice({ product })
  const fulfilment = getFulfilmentState(product)
  const saleCompareAt =
    cheapestPrice?.price_type === "sale" &&
    cheapestPrice.original_price_number > cheapestPrice.calculated_price_number
      ? cheapestPrice.original_price
      : null

  return (
    <div className="bg-[#F4F2ED] text-[#1A1A1A]" data-testid="product-container">
      <div className="mx-auto max-w-[1320px] px-[18px] pt-4 text-xs font-medium tracking-[0.03em] text-[#999] small:px-8 small:pt-5">
        <LocalizedClientLink href="/store" className="hover:text-[#C1440E]">
          Shop All
        </LocalizedClientLink>
        <span className="mx-2 opacity-60">&gt;</span>
        <LocalizedClientLink href="/store" className="hover:text-[#C1440E]">
          Shop All
        </LocalizedClientLink>
        <span className="mx-2 opacity-60">&gt;</span>
        <span>{product.title}</span>
      </div>

      <section className="mx-auto grid max-w-[1320px] gap-7 px-[18px] py-4 pb-20 small:grid-cols-[1.15fr_1fr] small:gap-14 small:px-8 small:py-6 small:pb-[72px]">
        <div className="small:sticky small:top-28 small:self-start">
          <ImageGallery images={images} fulfilment={fulfilment} />
        </div>
        <ProductActions product={product} region={region} />
      </section>

      <section id="reviews" className="mx-auto max-w-[1320px] border-t border-[#E8E6E0] px-[18px] py-12 small:px-8 small:py-16">
        <div className="mb-10 flex flex-col gap-8 small:flex-row small:items-start small:justify-between">
          <div className="flex gap-7">
            <div>
              <div className="text-[64px] font-black leading-[0.9] tracking-[-0.04em] text-[#0A0A0A]">
                4.9
              </div>
              <div className="my-2 text-base tracking-[1px] text-[#C1440E]">
                ★★★★★
              </div>
              <div className="text-[12.5px] text-[#666]">47 verified reviews</div>
            </div>
            <div className="min-w-[260px] pt-1">
              {[
                ["5★", "91%", "43"],
                ["4★", "9%", "4"],
                ["3★", "0%", "0"],
                ["2★", "0%", "0"],
                ["1★", "0%", "0"],
              ].map(([label, width, count]) => (
                <div key={label} className="mb-2 flex items-center gap-3 text-xs">
                  <span className="w-6 font-semibold text-[#666]">{label}</span>
                  <span className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#E8E6E0]">
                    <span
                      className="block h-full rounded-full bg-[#C1440E]"
                      style={{ width }}
                    />
                  </span>
                  <span className="w-6 text-right text-[#666]">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="max-w-[320px] text-[13px] leading-6 text-[#666] small:text-right">
            Real customer photos from MUSE orders, now stored locally on this
            site so the gallery does not depend on Squarespace.
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-black uppercase tracking-[0.02em] text-[#0A0A0A] small:text-[34px]">
                Photo reviews
              </h2>
              <p className="mt-1 text-[13px] text-[#666]">
                {photoReviews.length} customer-submitted photos
              </p>
            </div>
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.1em] text-[#999] small:block">
              Swipe to browse
            </span>
          </div>

          <div className="no-scrollbar -mx-[18px] flex snap-x gap-2 overflow-x-auto px-[18px] pb-3 small:mx-0 small:gap-4 small:px-0">
            {photoReviews.map((review, index) => (
              <article
                key={`${review.name}-${review.date}`}
                className="w-[126px] shrink-0 snap-start overflow-hidden rounded-[12px] bg-[#F8F7F4] ring-1 ring-[#E8E6E0] small:w-[calc((100%_-_3rem)/4)] small:max-w-[304px] small:rounded-[14px]"
              >
                <div className="relative aspect-[4/3] bg-[#ECE9E2]">
                  <Image
                    src={review.image}
                    alt={`Photo review from ${review.name}`}
                    fill
                    sizes="(min-width: 768px) 24vw, 126px"
                    className="object-cover"
                    priority={index < 4}
                  />
                </div>
                <div className="p-2.5 small:p-3.5">
                  <div className="mb-1.5 flex items-center justify-between gap-2 small:mb-2 small:gap-3">
                    <div className="text-[11px] font-black text-[#0A0A0A] small:text-[12.5px]">
                      {review.name}
                    </div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.04em] text-[#1F7A3A] small:text-[10px] small:tracking-[0.06em]">
                      Verified
                    </div>
                  </div>
                  <div className="mb-2 text-[10px] text-[#888] small:mb-3 small:text-[12px]">
                    {review.date}
                  </div>
                  <p className="line-clamp-4 text-[10.5px] font-medium leading-4 text-[#333] small:text-[12.5px] small:leading-5">
                    {review.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CompleteTheFit product={product} countryCode={_countryCode} />

      <RecentlyViewedProducts
        product={{
          id: product.id,
          title: product.title || "MUSE product",
          handle: product.handle,
          image: product.thumbnail || product.images?.[0]?.url,
          price: cheapestPrice?.calculated_price,
          compareAt: saleCompareAt,
          badge: fulfilment.shortLabel,
        }}
      />
    </div>
  )
}

export default ProductTemplate
