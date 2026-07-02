import { Migration } from "@medusajs/framework/mikro-orm/migrations"

type LegacyReview = {
  image?: string
  name: string
  text: string
  date?: string
  rating: number
}

const legacyReviews: LegacyReview[] = [
  {
    "name": "Aaliyah N.",
    "text": "Delivery took a bit, but customer service was mint with every question. Happy as.",
    "image": "/review-photos/review-50.webp",
    "date": "5 Jun 2026",
    "rating": 5
  },
  {
    "name": "Priya S.",
    "text": "I had to message for updates instead of getting them automatically. Product itself was alright.",
    "image": "/review-photos/review-66.webp",
    "date": "2 Jun 2026",
    "rating": 5
  },
  {
    "name": "Kauri B",
    "text": "The quality is top tier and shoes are brand new. They shipped in 2 days and it came a few days later. Communication was bad but I still received my package and it was not damaged. The shoes are literally brand new and have no scruffs marks. Honestly 8/10 would recommend this seller",
    "image": "/review-photos/review-73.jpeg",
    "date": "1 Jun 2026",
    "rating": 5
  },
  {
    "name": "Noah W.",
    "text": "Messaged about sizing and got a proper helpful reply. Cheers.",
    "image": "/review-photos/review-46.webp",
    "date": "28 May 2026",
    "rating": 5
  },
  {
    "name": "Sophie W.",
    "text": "Not bad, but not amazing either. Delivery was slow and I expected slightly better packaging",
    "image": "/review-photos/review-65.webp",
    "date": "21 May 2026",
    "rating": 5
  },
  {
    "name": "Talia V.",
    "text": "Tracking was quiet for a few days, which was annoying, but customer service explained it properly.",
    "image": "/review-photos/review-69.webp",
    "date": "21 May 2026",
    "rating": 5
  },
  {
    "name": "Matiu H",
    "text": "Took the full delivery time, but they replied fast and kept me in the loop.",
    "image": "/review-photos/review-52.webp",
    "date": "18 May 2026",
    "rating": 5
  },
  {
    "name": "Chloe B",
    "text": "Love them heaps, already had a few mates ask where from.",
    "image": "/review-photos/review-45.webp",
    "date": "6 May 2026",
    "rating": 5
  },
  {
    "name": "Talia F",
    "text": "Wait was longer than usual, but updates were clear and the shoes were worth it.",
    "image": "/review-photos/review-49.webp",
    "date": "6 May 2026",
    "rating": 5
  },
  {
    "name": "Grace H",
    "text": "Bit of a wait, no dramas though. They answered everything properly. Stoked overall",
    "image": "/review-photos/review-51.webp",
    "date": "6 May 2026",
    "rating": 5
  },
  {
    "name": "Sophie L",
    "text": "Came packed nicely, no dramas. Happy as with the quality.",
    "image": "/review-photos/review-44.webp",
    "date": "21 Apr 2026",
    "rating": 5
  },
  {
    "name": "Sam L",
    "text": "Tracking was confusing and didn’t update for ages. Made the whole order feel a bit stressful.",
    "image": "/review-photos/review-64.webp",
    "date": "8 Apr 2026",
    "rating": 5
  },
  {
    "name": "Arjun P",
    "text": "Honestly pretty chuffed. Sizing was bang on and they look clean.",
    "image": "/review-photos/review-43.webp",
    "date": "15 Mar 2026",
    "rating": 5
  },
  {
    "name": "Jayden R",
    "text": "Got these today, quality is actually crazy good. Way nicer in hand than I expected.",
    "image": "/review-photos/review-01.jpg",
    "date": "14 Mar 2026",
    "rating": 5
  },
  {
    "name": "Zach T",
    "text": "Quality is actually really solid, suede feels nice and soft. Happy with these.",
    "image": "/review-photos/review-02.webp",
    "date": "9 Mar 2026",
    "rating": 5
  },
  {
    "name": "Connor W",
    "text": "Worn them out once already and they still look great. Really happy with them.",
    "image": "/review-photos/review-03.webp",
    "date": "2 Mar 2026",
    "rating": 5
  },
  {
    "name": "Wiremu K",
    "text": "Comfy, clean, and packaged well. Would definitely order again.",
    "image": "/review-photos/review-38.webp",
    "date": "27 Feb 2026",
    "rating": 5
  },
  {
    "name": "Luke B",
    "text": "Was worried about timing, but they replied quickly and the jacket arrived mint.",
    "image": "/review-photos/review-53.webp",
    "date": "27 Feb 2026",
    "rating": 5
  },
  {
    "name": "Arjun P.",
    "text": "I usually wear US 8 and ordered US 8. Fit was true to size and looked just like the photos.",
    "image": "/review-photos/review-67.webp",
    "date": "27 Feb 2026",
    "rating": 5
  },
  {
    "name": "Sophie L",
    "text": "Honestly feels like retail, even the puff and shape is on point.",
    "image": "/review-photos/review-04.jpg",
    "date": "26 Feb 2026",
    "rating": 5
  },
  {
    "name": "Liam K",
    "text": "Been using them daily, holding up well so far. No complaints.",
    "image": "/review-photos/review-05.webp",
    "date": "22 Feb 2026",
    "rating": 5
  },
  {
    "name": "Jay M",
    "text": "Suede came in nice condition, just brushed them lightly and they look perfect.",
    "image": "/review-photos/review-06.webp",
    "date": "18 Feb 2026",
    "rating": 5
  },
  {
    "name": "Ethan P",
    "text": "Only thing is they run slightly snug for me, but overall still really happy.",
    "image": "/review-photos/review-07.webp",
    "date": "10 Feb 2026",
    "rating": 5
  },
  {
    "name": "Chloe N",
    "text": "Didn’t think I’d be a Birks person but yeah… these changed my mind 😂",
    "image": "/review-photos/review-08.webp",
    "date": "5 Feb 2026",
    "rating": 5
  },
  {
    "name": "Ryan D",
    "text": "Came exactly like the pics. Colour is proper nice in person.",
    "image": "/review-photos/review-09.webp",
    "date": "30 Jan 2026",
    "rating": 5
  },
  {
    "name": "Hannah S",
    "text": "Footbed feels proper supportive, can tell they’ll get even better with wear.",
    "image": "/review-photos/review-10.webp",
    "date": "24 Jan 2026",
    "rating": 5
  },
  {
    "name": "Josh B",
    "text": "Box came in mint condition, everything proper tidy. Stoked with it.",
    "image": "/review-photos/review-11.webp",
    "date": "18 Jan 2026",
    "rating": 5
  },
  {
    "name": "Grace G",
    "text": "Was a bit unsure at first, but honestly stoked once they arrived.",
    "image": "/review-photos/review-37.webp",
    "date": "16 Jan 2026",
    "rating": 5
  },
  {
    "name": "Levi C",
    "text": "Was a bit iffy ordering at first but nah these are mean 🔥",
    "image": "/review-photos/review-12.webp",
    "date": "12 Jan 2026",
    "rating": 5
  },
  {
    "name": "Tyler F",
    "text": "Been wearing them non stop, footbed already starting to shape to my foot. Comfy as.",
    "image": "/review-photos/review-13.webp",
    "date": "6 Jan 2026",
    "rating": 5
  },
  {
    "name": "Olivia G",
    "text": "Delivery took a couple extra days but quality is proper aye, worth the wait.",
    "image": "/review-photos/review-14.webp",
    "date": "28 Dec 2025",
    "rating": 5
  },
  {
    "name": "Noah H",
    "text": "They look even better in person tbh, super happy with them",
    "image": "/review-photos/review-15.webp",
    "date": "20 Dec 2025",
    "rating": 5
  },
  {
    "name": "Mason J",
    "text": "Nice bag",
    "image": "/review-photos/review-16.jpg",
    "date": "14 Dec 2025",
    "rating": 5
  },
  {
    "name": "Emily A",
    "text": "Was kinda nervous ordering but they’re sooo nice. Might’ve sized up tbh but still comfy.",
    "image": "/review-photos/review-17.webp",
    "date": "7 Dec 2025",
    "rating": 5
  },
  {
    "name": "Sophl V",
    "text": "So happy with these!! delivery was pretty quick too, thank youuu 🫶",
    "image": "/review-photos/review-18.webp",
    "date": "30 Nov 2025",
    "rating": 5
  },
  {
    "name": "Daniel P",
    "text": "Delivery was a bit slow but product is solid so can’t complain",
    "image": "/review-photos/review-19.webp",
    "date": "22 Nov 2025",
    "rating": 5
  },
  {
    "name": "Alexia E",
    "text": "Got them today, box was a tiny bit scuffed but shoes are mint so not too bothered. Cheers bro.",
    "image": "/review-photos/review-20.webp",
    "date": "15 Nov 2025",
    "rating": 5
  },
  {
    "name": "Maya K",
    "text": "Good experience overall. I had a few questions before ordering and they were answered properly, not just quick one-word replies. The product came tidy and I’d order again.",
    "image": "/review-photos/review-56.webp",
    "date": "8 Nov 2025",
    "rating": 5
  },
  {
    "name": "Ella R",
    "text": "Colour is even nicer in real life, goes with everything I wear",
    "image": "/review-photos/review-21.webp",
    "date": "7 Nov 2025",
    "rating": 5
  },
  {
    "name": "Ben T",
    "text": "Took a few days to break in but sweet now. Quality is solid.",
    "image": "/review-photos/review-22.webp",
    "date": "30 Oct 2025",
    "rating": 5
  },
  {
    "name": "Zoe K",
    "text": "Obsessed with this 😭 fits sooo nice. Would maybe go up a size if you want it baggy though",
    "image": "/review-photos/review-23.jpg",
    "date": "24 Oct 2025",
    "rating": 5
  },
  {
    "name": "Aria W",
    "text": "Perfect neutral colour, matches literally everything I own",
    "image": "/review-photos/review-24.webp",
    "date": "18 Oct 2025",
    "rating": 5
  },
  {
    "name": "Sam D",
    "text": "shoes were perfect so no stress",
    "image": "/review-photos/review-25.webp",
    "date": "11 Oct 2025",
    "rating": 5
  },
  {
    "name": "Luke S",
    "text": "Perfect everyday jacket, goes with everything. So glad I got this one",
    "image": "/review-photos/review-26.jpg",
    "date": "6 Oct 2025",
    "rating": 5
  },
  {
    "name": "Mia R",
    "text": "The box arrived pretty crushed, which wasn’t ideal. Shoes were fine inside, but presentation could be better.",
    "image": "/review-photos/review-63.webp",
    "date": "5 Oct 2025",
    "rating": 5
  },
  {
    "name": "Tiana M",
    "text": "Jacket is proper warm aye, been wearing it every night. Zips a bit stiff at first but all good now.",
    "image": "/review-photos/review-27.jpg",
    "date": "30 Sep 2025",
    "rating": 5
  },
  {
    "name": "Josh N",
    "text": "Feels super puffy and warm, literally perfect for this weather",
    "image": "/review-photos/review-28.jpg",
    "date": "22 Sep 2025",
    "rating": 5
  },
  {
    "name": "Maddie F",
    "text": "Came a day late but quality is mean so can’t really complain.",
    "image": "/review-photos/review-29.jpg",
    "date": "14 Sep 2025",
    "rating": 5
  },
  {
    "name": "Kieran P",
    "text": "Not too heavy which I rate, still keeps me warm as. Good pickup.",
    "image": "/review-photos/review-30.webp",
    "date": "5 Sep 2025",
    "rating": 5
  },
  {
    "name": "Bella T",
    "text": "Wait these are actually so cute in person 😭 fit is perfect too, I’m obsessed",
    "image": "/review-photos/review-31.png",
    "date": "29 Aug 2025",
    "rating": 5
  },
  {
    "name": "Jordan H",
    "text": "Chucked them on straight away, comfy as. Will defs be back for another pair.",
    "image": "/review-photos/review-32.png",
    "date": "20 Aug 2025",
    "rating": 5
  },
  {
    "name": "Jordan T",
    "text": "Took too long for me personally. Quality was decent, but I probably wouldn’t order if I needed something fast.",
    "image": "/review-photos/review-62.webp",
    "date": "16 Aug 2025",
    "rating": 5
  },
  {
    "name": "Leilani K.",
    "text": "I normally buy women’s sizing and sized down like suggested. Jacket fit was spot on",
    "image": "/review-photos/review-68.webp",
    "date": "16 Aug 2025",
    "rating": 5
  },
  {
    "name": "Sienna L",
    "text": "Love ittt, been getting compliments already 🫶",
    "image": "/review-photos/review-33.png",
    "date": "12 Aug 2025",
    "rating": 5
  },
  {
    "name": "Mason D",
    "text": "Took the expected time, but all good. Worth it when they arrived.",
    "image": "/review-photos/review-47.webp",
    "date": "3 Jul 2025",
    "rating": 5
  },
  {
    "name": "Olivia K.",
    "text": "Customer service replied eventually, but I had to follow up twice. Product was okay once it arrived.",
    "image": "/review-photos/review-61.webp",
    "date": "30 Jun 2025",
    "rating": 5
  },
  {
    "name": "Moana L",
    "text": "I had wide feet and asked first. They recommended sizing up, which ended up being right.",
    "image": "/review-photos/review-70.webp",
    "date": "30 Jun 2025",
    "rating": 5
  },
  {
    "name": "Lucas A",
    "text": "Good honest experience. Delivery took a bit, but the product came exactly as expected. Support replied quickly and made the whole process feel easy.",
    "image": "/review-photos/review-60.webp",
    "date": "11 May 2025",
    "rating": 5
  },
  {
    "name": "Meera J",
    "text": "Delivery took longer than I expected and tracking barely updated. Product was fine, but the wait was annoying",
    "image": "/review-photos/review-59.webp",
    "date": "24 Apr 2025",
    "rating": 5
  },
  {
    "name": "Tane W",
    "text": "I ordered my usual size and they felt slightly snug at first, but comfy after wearing",
    "image": "/review-photos/review-71.jpeg",
    "date": "24 Apr 2025",
    "rating": 5
  },
  {
    "name": "Mason D",
    "text": "Wasn’t the fastest delivery, but I knew that before ordering. Communication was good the whole way and I’m really happy with the final product.",
    "image": "/review-photos/review-58.webp",
    "date": "9 Feb 2025",
    "rating": 5
  },
  {
    "name": "Anahera S.",
    "text": "Not the fastest delivery, but the updates were honest and the quality was better than expected",
    "image": "/review-photos/review-72.webp",
    "date": "18 Jan 2025",
    "rating": 5
  },
  {
    "name": "Moana L",
    "text": "Really happy with these, sizing was accurate and they go with everything.",
    "image": "/review-photos/review-36.webp",
    "date": "9 Jan 2025",
    "rating": 5
  },
  {
    "name": "Ruby A",
    "text": "Wasn’t sure at first, but they’re actually mint in person.",
    "image": "/review-photos/review-42.webp",
    "date": "17 Nov 2024",
    "rating": 5
  },
  {
    "name": "Talia M",
    "text": "Mean as, shoes looked mint and tracking came through sweet.",
    "image": "/review-photos/review-40.webp",
    "date": "4 Oct 2024",
    "rating": 5
  },
  {
    "name": "Mason K.",
    "text": "Stoked with these, comfy fit and turned up all good.",
    "image": "/review-photos/review-41.webp",
    "date": "13 Jul 2024",
    "rating": 5
  },
  {
    "name": "Rangi C.",
    "text": "Good quality for the price. Arrived quicker than I expected too.",
    "image": "/review-photos/review-35.webp",
    "date": "22 May 2024",
    "rating": 5
  },
  {
    "name": "Ethan W.",
    "text": "Solid pair, no issues at all. I would size up tho",
    "image": "/review-photos/review-39.webp",
    "date": "22 May 2024",
    "rating": 5
  },
  {
    "name": "Anika S",
    "text": "First time ordering from Muse and I was honestly a bit unsure, but everything went smooth. The shoes came well packed, sizing was right, and customer service was really helpful.",
    "image": "/review-photos/review-55.webp",
    "date": "7 Apr 2024",
    "rating": 5
  },
  {
    "name": "Ella M",
    "text": "Really happy with my order. Delivery took a little while, but the team replied quickly whenever I asked for an update. Product arrived looking exactly like the photos, so I was happy as.",
    "image": "/review-photos/review-54.webp",
    "date": "18 Mar 2024",
    "rating": 5
  },
  {
    "name": "Jess M",
    "text": "Super easy order, tracking was clear and the shoes looked mint in person.",
    "image": "/review-photos/review-34.webp",
    "date": "14 Mar 2024",
    "rating": 5
  },
  {
    "name": "Meera J",
    "text": "Got these for my partner and they were stoked. Easy win.",
    "image": "/review-photos/review-48.webp",
    "date": "18 Feb 2024",
    "rating": 5
  },
  {
    "name": "Chloe B.",
    "text": "Ordered a jacket and it fits really nicely. Warm without being too bulky, and the sizing advice was helpful. Took the stated delivery time, but all good.",
    "image": "/review-photos/review-57.webp",
    "date": "12 Feb 2024",
    "rating": 5
  },
  {
    "name": "Manaia Edwards",
    "text": "Bad, I ordered a size 37 and got sent a pair 6 sizes too big.",
    "date": "22 Jun 2026",
    "rating": 1
  },
  {
    "name": "Roxy Campbell",
    "text": "Items delivered as expected, customer service is always great, and the shoes are exactly as described. Can't fault the experience with Muse, definitely my go-to for quality shoes!",
    "date": "22 Jun 2026",
    "rating": 5
  },
  {
    "name": "Saini Tuulima",
    "text": "Amazing quality! Obsessed with my jacket I ordered another one for my son in white and black :) will be ordering more!",
    "date": "14 Jun 2026",
    "rating": 5
  },
  {
    "name": "Emma Muir",
    "text": "The shoes are great, good size etc love them! Shipping takes a little bit but worth the wait for the price",
    "date": "13 May 2026",
    "rating": 5
  },
  {
    "name": "Armani Tufuga-Mason",
    "text": "Great quality and worth the wait",
    "date": "11 May 2026",
    "rating": 5
  },
  {
    "name": "Brad White",
    "text": "My first purchasing experience with Muse was outstanding, the Customer Service that I received was excellent. The answers to my questions were answered quickly and I was very impressed with the service.",
    "date": "27 Apr 2026",
    "rating": 5
  },
  {
    "name": "Kristin Crews",
    "text": "Colourway is sooo nice in person. Way better than the pics tbh. Super comfy as well, defs gonna be wearing these heaps.",
    "date": "11 Apr 2026",
    "rating": 5
  },
  {
    "name": "Kristin Crews",
    "text": "Vest came in yesterday and it's proper warm aye. Fits perfect over hoodies. Been wearing it nonstop already 😂 good stuff.",
    "date": "11 Apr 2026",
    "rating": 5
  },
  {
    "name": "Melanie Fraser",
    "text": "Honestly stoked with these. Quality feels mint and they're comfy straight away. Love for the quick shipping too.",
    "date": "11 Apr 2026",
    "rating": 4
  },
  {
    "name": "Mary Huggins",
    "text": "Quality is very good, I did purchase the wrong size and the return process was easy and straight forward, great communication and support. A bit of a wait for your delivery but that is what is expected.",
    "date": "5 Apr 2026",
    "rating": 5
  },
  {
    "name": "Ana Leah",
    "text": "Love the jacket, wish I sized up but overall the jacket is perfect 👌",
    "date": "26 Mar 2026",
    "rating": 5
  },
  {
    "name": "Molly Moananu",
    "text": "Love love love. Looks and feels like the real deal. Would suggest going up a size though. Team was absolutely amazing with communication!",
    "date": "25 Feb 2026",
    "rating": 5
  }
]

const sqlValue = (value?: string | null) => {
  if (value === undefined || value === null) {
    return "null"
  }

  return `'${value.replace(/'/g, "''")}'`
}

const sqlDate = (value?: string) => {
  if (!value) {
    return "now()"
  }

  const date = new Date(`${value} 12:00:00 GMT+1200`)

  if (Number.isNaN(date.getTime())) {
    return "now()"
  }

  return `${sqlValue(date.toISOString())}::timestamptz`
}

export class Migration20260702001000 extends Migration {
  override async up(): Promise<void> {
    const values = legacyReviews
      .map(
        (review, index) =>
          `('rev_legacy_${String(index + 1).padStart(3, "0")}', null, ${sqlValue(
            review.text
          )}, ${review.rating}, ${sqlValue(review.name)}, null, null, ${sqlValue(
            review.image
          )}, 'legacy', 'approved', true, ${sqlDate(review.date)})`
      )
      .join(",")

    this.addSql(
      `insert into "review" ("id", "title", "content", "rating", "reviewer_name", "reviewer_email", "product_id", "image_url", "source", "status", "verified_purchase", "created_at")
select incoming.*
from (values ${values}) as incoming("id", "title", "content", "rating", "reviewer_name", "reviewer_email", "product_id", "image_url", "source", "status", "verified_purchase", "created_at")
where not exists (
  select 1 from "review" existing
  where existing."source" = 'legacy'
    and existing."reviewer_name" = incoming."reviewer_name"
    and existing."content" = incoming."content"
    and coalesce(existing."image_url", '') = coalesce(incoming."image_url", '')
)
on conflict ("id") do nothing;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`delete from "review" where "source" = 'legacy';`)
  }
}
