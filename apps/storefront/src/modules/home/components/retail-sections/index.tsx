import CampaignImage from "@modules/common/components/campaign-image"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export function RetailBenefits() {
  const benefits = [
    ["Tracked delivery", "Updates from dispatch to your door", "M3 7h11v10H3z M14 11h4l3 3v3h-7z M5 20h4 M16 20h4"],
    ["NZ Stock available", "Look for the green NZ Stock label", "M4 8h16v11H4z M7 8V5h10v3 M8 13h8"],
    ["30-day returns", "See terms for eligibility and exclusions", "M5 5h14v14H5z M8 9h8 M8 13h5"],
    ["Real MUSE support", "Support based here in New Zealand", "M4 12a8 8 0 1 1 16 0v5h-4v-5h4 M4 12v5h4v-5H4 M8 19c1 1 2.3 1.5 4 1.5"],
  ]
  return <section className="muse-retail-benefits" aria-label="Shopping benefits">
    <div>{benefits.map(([title, text, path]) => <div className="muse-retail-benefit" key={title}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={path}/></svg>
      <div><strong>{title}</strong><span>{text}</span></div>
    </div>)}</div>
  </section>
}

export function RetailEditorial() {
  const campaigns = [
    { image: "/campaigns/spring-rotation/artboard-2.jpg", alt: "MUSE spring footwear campaign", eyebrow: "Spring rotation", title: "Footwear taking over", action: "Shop the edit", href: "/collections/spring-rotation" },
    { image: "/campaigns/spring-rotation/artboard-3.jpg", alt: "MUSE curated footwear", eyebrow: "Curated by MUSE", title: "The new shoe line-up", action: "Explore footwear", href: "/categories/footwear" },
  ]
  return <section className="muse-retail-editorial" aria-label="Featured campaigns">
    {campaigns.map((campaign, index) => <LocalizedClientLink href={campaign.href} key={campaign.href} className="muse-editorial-tile">
      <CampaignImage campaign={index === 0 ? 2 : 3} alt={campaign.alt} sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1440px) calc((100vw - 80px) / 2), 680px"/>
      <div className={index === 1 ? "muse-editorial-copy light" : "muse-editorial-copy"}>
        <p>{campaign.eyebrow}</p><h2>{campaign.title}</h2><span>{campaign.action}</span>
      </div>
    </LocalizedClientLink>)}
  </section>
}

export function RetailCategories() {
  const tiles = [
    ["Sneakers", "/campaigns/spring-rotation/artboard-4.jpg", "/categories/footwear-sneakers"],
    ["Outerwear", "/email-products/nuptse-jacket-black-square.jpg", "/categories/outerwear"],
    ["Clogs & slides", "/email-products/birkenstock-boston-taupe-square.jpg", "/store?q=birkenstock"],
    ["New arrivals", "/campaigns/spring-rotation/artboard-5.jpg", "/collections/new-arrivals"],
    ["NZ Stock", "/email-products/asics-gel-kayano-14-square.jpg", "/store?stock=nz-stock"],
  ]
  return <section className="muse-retail-categories" aria-labelledby="retail-category-title">
    <div className="muse-retail-section-head"><div><p>Browse faster</p><h2 id="retail-category-title">Shop by category</h2></div><LocalizedClientLink href="/store">Shop all</LocalizedClientLink></div>
    <div className="muse-category-rail">{tiles.map(([title, image, href]) => <LocalizedClientLink key={title} href={href} className="muse-category-tile">
      {image.includes("/campaigns/") ? <CampaignImage campaign={title === "Sneakers" ? 4 : 5} alt={title} sizes="(max-width: 767px) 68vw, (max-width: 1440px) 18vw, 260px"/> : <Image src={image} alt={title} fill quality={60} sizes="(max-width: 767px) 68vw, (max-width: 1440px) 18vw, 260px" className="object-cover"/>}<span>{title}</span>
    </LocalizedClientLink>)}</div>
  </section>
}
