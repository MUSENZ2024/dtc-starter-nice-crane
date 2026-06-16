import { HttpTypes } from "@medusajs/types"

export type MuseReview = {
  id: string
  productHandles?: string[]
  category: "footwear" | "apparel" | "bags" | "general"
  rating: 1 | 2 | 3 | 4 | 5
  image?: string
  name: string
  date: string
  text: string
  fitVote?: "Runs small" | "True to size" | "Runs large" | "Relaxed fit"
  verified: boolean
}

export type ProductReviewSet = {
  reviews: MuseReview[]
  matchType: "product" | "category" | "broad"
  category: MuseReview["category"]
}

const PRODUCT_HANDLE_REVIEWS: MuseReview[] = []

const CATEGORY_REVIEWS: MuseReview[] = [
  { id: "footwear-01", category: "footwear", rating: 5, image: "/review-photos/review-01.jpg", name: "Jayden R", date: "14 Mar 2026", text: "Got these today, quality is actually crazy good. Way nicer in hand than I expected.", fitVote: "True to size", verified: true },
  { id: "footwear-02", category: "footwear", rating: 5, image: "/review-photos/review-02.webp", name: "Zach T", date: "9 Mar 2026", text: "Quality is actually really solid, suede feels nice and soft. Happy with these.", fitVote: "True to size", verified: true },
  { id: "footwear-03", category: "footwear", rating: 5, image: "/review-photos/review-03.webp", name: "Connor W", date: "2 Mar 2026", text: "Worn them out once already and they still look great. Really happy with them.", fitVote: "True to size", verified: true },
  { id: "footwear-04", category: "footwear", rating: 5, image: "/review-photos/review-04.jpg", name: "Sophie L", date: "26 Feb 2026", text: "Honestly feels like retail, even the puff and shape is on point.", fitVote: "True to size", verified: true },
  { id: "footwear-05", category: "footwear", rating: 5, image: "/review-photos/review-05.webp", name: "Liam K", date: "22 Feb 2026", text: "Been using them daily, holding up well so far. No complaints.", fitVote: "True to size", verified: true },
  { id: "footwear-06", category: "footwear", rating: 5, image: "/review-photos/review-06.webp", name: "Jay M", date: "18 Feb 2026", text: "Suede came in nice condition, just brushed them lightly and they look perfect.", fitVote: "True to size", verified: true },
  { id: "footwear-07", category: "footwear", rating: 4, image: "/review-photos/review-07.webp", name: "Ethan P", date: "10 Feb 2026", text: "Only thing is they run slightly snug for me, but overall still really happy.", fitVote: "Runs small", verified: true },
  { id: "footwear-08", category: "footwear", rating: 5, image: "/review-photos/review-08.webp", name: "Chloe N", date: "5 Feb 2026", text: "Did not think I would be a Birks person but these changed my mind.", fitVote: "True to size", verified: true },
  { id: "footwear-09", category: "footwear", rating: 5, image: "/review-photos/review-09.webp", name: "Ryan D", date: "30 Jan 2026", text: "Came exactly like the pics. Colour is proper nice in person.", fitVote: "True to size", verified: true },
  { id: "footwear-10", category: "footwear", rating: 5, image: "/review-photos/review-10.webp", name: "Hannah S", date: "24 Jan 2026", text: "Footbed feels proper supportive, can tell they will get even better with wear.", fitVote: "True to size", verified: true },
  { id: "footwear-11", category: "footwear", rating: 5, image: "/review-photos/review-11.webp", name: "Josh B", date: "18 Jan 2026", text: "Box came in mint condition, everything proper tidy. Stoked with it.", fitVote: "True to size", verified: true },
  { id: "footwear-12", category: "footwear", rating: 5, image: "/review-photos/review-12.webp", name: "Levi C", date: "12 Jan 2026", text: "Was a bit iffy ordering at first but these are mean.", fitVote: "True to size", verified: true },
  { id: "footwear-13", category: "footwear", rating: 5, image: "/review-photos/review-13.webp", name: "Tyler F", date: "6 Jan 2026", text: "Been wearing them non stop, footbed already starting to shape to my foot. Comfy as.", fitVote: "True to size", verified: true },
  { id: "footwear-14", category: "footwear", rating: 4, image: "/review-photos/review-14.webp", name: "Olivia G", date: "28 Dec 2025", text: "Delivery took a couple extra days but quality is proper aye, worth the wait.", fitVote: "True to size", verified: true },
  { id: "footwear-15", category: "footwear", rating: 5, image: "/review-photos/review-15.webp", name: "Noah H", date: "20 Dec 2025", text: "They look even better in person tbh, super happy with them.", fitVote: "True to size", verified: true },
  { id: "bags-01", category: "bags", rating: 5, image: "/review-photos/review-16.jpg", name: "Mason J", date: "14 Dec 2025", text: "Nice bag, clean shape and the stitching is tidy.", verified: true },
  { id: "footwear-16", category: "footwear", rating: 4, image: "/review-photos/review-17.webp", name: "Emily A", date: "7 Dec 2025", text: "Was kinda nervous ordering but they are sooo nice. Might have sized up tbh but still comfy.", fitVote: "Runs small", verified: true },
  { id: "footwear-17", category: "footwear", rating: 5, image: "/review-photos/review-18.webp", name: "Sophl V", date: "30 Nov 2025", text: "So happy with these. Delivery was pretty quick too, thank you.", fitVote: "True to size", verified: true },
  { id: "footwear-18", category: "footwear", rating: 4, image: "/review-photos/review-19.webp", name: "Daniel P", date: "22 Nov 2025", text: "Delivery was a bit slow but product is solid so cannot complain.", fitVote: "True to size", verified: true },
  { id: "footwear-19", category: "footwear", rating: 5, image: "/review-photos/review-20.webp", name: "Alexia E", date: "15 Nov 2025", text: "Got them today, box was a tiny bit scuffed but shoes are mint so not too bothered. Cheers bro.", fitVote: "True to size", verified: true },
  { id: "footwear-20", category: "footwear", rating: 5, image: "/review-photos/review-21.webp", name: "Ella R", date: "7 Nov 2025", text: "Colour is even nicer in real life, goes with everything I wear.", fitVote: "True to size", verified: true },
  { id: "footwear-21", category: "footwear", rating: 4, image: "/review-photos/review-22.webp", name: "Ben T", date: "30 Oct 2025", text: "Took a few days to break in but sweet now. Quality is solid.", fitVote: "True to size", verified: true },
  { id: "apparel-01", category: "apparel", rating: 5, image: "/review-photos/review-23.jpg", name: "Zoe K", date: "24 Oct 2025", text: "Obsessed with this, fits sooo nice. Would maybe go up a size if you want it baggy though.", fitVote: "Relaxed fit", verified: true },
  { id: "footwear-22", category: "footwear", rating: 5, image: "/review-photos/review-24.webp", name: "Aria W", date: "18 Oct 2025", text: "Perfect neutral colour, matches literally everything I own.", fitVote: "True to size", verified: true },
  { id: "footwear-23", category: "footwear", rating: 5, image: "/review-photos/review-25.webp", name: "Sam D", date: "11 Oct 2025", text: "Shoes were perfect so no stress.", fitVote: "True to size", verified: true },
  { id: "apparel-02", category: "apparel", rating: 5, image: "/review-photos/review-26.jpg", name: "Luke S", date: "6 Oct 2025", text: "Perfect everyday jacket, goes with everything. So glad I got this one.", fitVote: "True to size", verified: true },
  { id: "apparel-03", category: "apparel", rating: 4, image: "/review-photos/review-27.jpg", name: "Tiana M", date: "30 Sep 2025", text: "Jacket is proper warm aye, been wearing it every night. Zips a bit stiff at first but all good now.", fitVote: "True to size", verified: true },
  { id: "apparel-04", category: "apparel", rating: 5, image: "/review-photos/review-28.jpg", name: "Josh N", date: "22 Sep 2025", text: "Feels super puffy and warm, literally perfect for this weather.", fitVote: "True to size", verified: true },
  { id: "apparel-05", category: "apparel", rating: 4, image: "/review-photos/review-29.jpg", name: "Maddie F", date: "14 Sep 2025", text: "Came a day late but quality is mean so cannot really complain.", fitVote: "True to size", verified: true },
  { id: "apparel-06", category: "apparel", rating: 5, image: "/review-photos/review-30.webp", name: "Kieran P", date: "5 Sep 2025", text: "Not too heavy which I rate, still keeps me warm as. Good pickup.", fitVote: "True to size", verified: true },
  { id: "footwear-24", category: "footwear", rating: 5, image: "/review-photos/review-31.png", name: "Bella T", date: "29 Aug 2025", text: "Wait these are actually so cute in person. Fit is perfect too, I am obsessed.", fitVote: "True to size", verified: true },
  { id: "footwear-25", category: "footwear", rating: 5, image: "/review-photos/review-32.png", name: "Jordan H", date: "20 Aug 2025", text: "Chucked them on straight away, comfy as. Will defs be back for another pair.", fitVote: "True to size", verified: true },
  { id: "apparel-07", category: "apparel", rating: 5, image: "/review-photos/review-33.png", name: "Sienna L", date: "12 Aug 2025", text: "Love it, been getting compliments already.", fitVote: "True to size", verified: true },
  { id: "footwear-26", category: "footwear", rating: 5, name: "Max C", date: "4 Aug 2025", text: "Sizing advice was bang on and they arrived looking exactly like the photos.", fitVote: "True to size", verified: true },
  { id: "footwear-27", category: "footwear", rating: 5, name: "Tayla B", date: "27 Jul 2025", text: "Comfort is better than expected. I have worn them most days since they landed.", fitVote: "True to size", verified: true },
  { id: "footwear-28", category: "footwear", rating: 5, name: "Reuben M", date: "18 Jul 2025", text: "Clean pair, no glue marks or weird shape. Really happy with the pickup.", fitVote: "True to size", verified: true },
  { id: "footwear-29", category: "footwear", rating: 4, name: "Amy P", date: "9 Jul 2025", text: "A little snug at first but settled after one wear. Would still buy again.", fitVote: "Runs small", verified: true },
  { id: "apparel-08", category: "apparel", rating: 5, name: "Nate H", date: "1 Jul 2025", text: "Warm without being bulky and the fit is clean over a hoodie.", fitVote: "Relaxed fit", verified: true },
  { id: "apparel-09", category: "apparel", rating: 5, name: "Mia S", date: "23 Jun 2025", text: "The material feels premium and the colour was accurate to the photos.", fitVote: "True to size", verified: true },
  { id: "apparel-10", category: "apparel", rating: 4, name: "Isaac K", date: "14 Jun 2025", text: "Good weight and finish. I sized up for a relaxed fit and it was right.", fitVote: "Relaxed fit", verified: true },
  { id: "bags-02", category: "bags", rating: 5, name: "Grace T", date: "6 Jun 2025", text: "Holds more than I expected and the hardware feels sturdy.", verified: true },
  { id: "bags-03", category: "bags", rating: 5, name: "Joel A", date: "30 May 2025", text: "Really tidy everyday bag. Easy to style and arrived packed well.", verified: true },
  { id: "general-01", category: "general", rating: 5, name: "Paige W", date: "22 May 2025", text: "Customer service helped with sizing and the order arrived fast.", verified: true },
  { id: "general-02", category: "general", rating: 5, name: "Cole V", date: "15 May 2025", text: "Photos were accurate and the condition was exactly what I expected.", verified: true },
  { id: "general-03", category: "general", rating: 5, name: "Ruby D", date: "8 May 2025", text: "Second order from MUSE and both have been easy. Packaging was tidy too.", verified: true },
  { id: "general-04", category: "general", rating: 4, name: "Finn R", date: "29 Apr 2025", text: "Shipping updates could have been a bit clearer but the item itself was great.", verified: true },
  { id: "general-05", category: "general", rating: 5, name: "Ava M", date: "20 Apr 2025", text: "Exactly what I wanted, inspected well before sending and no surprises.", verified: true },
  { id: "general-06", category: "general", rating: 5, name: "Leo N", date: "12 Apr 2025", text: "Legit quality, easy checkout, and the tracking came through quickly.", verified: true },
]

export const allMuseReviews = [
  ...PRODUCT_HANDLE_REVIEWS,
  ...CATEGORY_REVIEWS,
]

const footwearTerms = [
  "shoe",
  "sneaker",
  "slide",
  "sandal",
  "birk",
  "clog",
  "boot",
  "yeezy",
  "jordan",
  "dunk",
]

const apparelTerms = [
  "jacket",
  "hoodie",
  "tee",
  "shirt",
  "pants",
  "puffer",
  "fleece",
  "vest",
  "crew",
  "sweat",
]

const bagTerms = ["bag", "tote", "duffle", "backpack", "pouch"]

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term))

export function getProductReviewSet(
  product: HttpTypes.StoreProduct
): ProductReviewSet {
  const handle = product.handle
  const category = inferReviewCategory(product)
  const productReviews = handle
    ? PRODUCT_HANDLE_REVIEWS.filter((review) =>
        review.productHandles?.includes(handle)
      )
    : []

  if (productReviews.length) {
    return {
      reviews: productReviews,
      matchType: "product",
      category,
    }
  }

  const categoryReviews = CATEGORY_REVIEWS.filter(
    (review) => review.category === category
  )

  if (categoryReviews.length) {
    return {
      reviews: categoryReviews,
      matchType: "category",
      category,
    }
  }

  return {
    reviews: CATEGORY_REVIEWS,
    matchType: "broad",
    category: "general",
  }
}

export function getReviewStats(reviews: MuseReview[]) {
  const total = reviews.length
  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => review.rating === rating).length
    const percentage = total ? Math.round((count / total) * 100) : 0

    return { rating, count, percentage }
  })

  const average = total
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
    : 0
  const verifiedCount = reviews.filter((review) => review.verified).length

  return {
    average,
    distribution,
    total,
    verifiedCount,
  }
}

function inferReviewCategory(product: HttpTypes.StoreProduct): MuseReview["category"] {
  const categoryText = [
    product.title,
    product.subtitle,
    product.handle,
    product.type?.value,
    product.collection?.title,
    product.collection?.handle,
    product.categories?.map((category) => category.name).join(" "),
    product.categories?.map((category) => category.handle).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (includesAny(categoryText, bagTerms)) {
    return "bags"
  }

  if (includesAny(categoryText, apparelTerms)) {
    return "apparel"
  }

  if (includesAny(categoryText, footwearTerms)) {
    return "footwear"
  }

  return "general"
}
