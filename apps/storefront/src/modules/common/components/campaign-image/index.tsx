import { campaignImages } from "assets/performance/campaigns"

/** Pre-sized, hashed assets avoid a runtime image-transform request on Cloud. */
export default function CampaignImage({
  campaign,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
}: {
  campaign: keyof typeof campaignImages
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  const variants = campaignImages[campaign]
  const fallback = variants[2].webp
  return (
    <picture>
      <source type="image/avif" srcSet={variants.map((v) => `${v.avif.src} ${v.width}w`).join(", ")} sizes={sizes} />
      <source type="image/webp" srcSet={variants.map((v) => `${v.webp.src} ${v.width}w`).join(", ")} sizes={sizes} />
      {/* Already optimised at source; next/image would add another transform. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fallback.src} srcSet={variants.map((v) => `${v.webp.src} ${v.width}w`).join(", ")} sizes={sizes}
        alt={alt} width={fallback.width} height={fallback.height}
        loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined}
        decoding="async" className={`absolute inset-0 h-full w-full ${className}`} />
    </picture>
  )
}
