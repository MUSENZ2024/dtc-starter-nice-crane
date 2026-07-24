import { getBaseURL } from "@lib/util/env"
import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/account/",
        "/checkout",
        "/cart",
        "/saved",
        "/order/",
        "/*/account/",
        "/*/checkout",
        "/*/cart",
        "/*/saved",
        "/*/order/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
