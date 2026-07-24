import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MUSE NZ | Affordable Sneakers, Shoes & Streetwear",
    short_name: "MUSE NZ",
    description:
      "Affordable sneakers, shoes, puffers and streetwear for New Zealand.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F2ED",
    theme_color: "#0A0A0A",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
