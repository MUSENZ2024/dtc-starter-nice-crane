import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Inter } from "next/font/google"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  applicationName: "MUSE NZ",
  title: {
    default: "MUSE NZ | Affordable Sneakers, Shoes & Streetwear",
    template: "%s | MUSE NZ",
  },
  description:
    "Shop affordable sneakers, shoes, retro runners, puffers and streetwear at MUSE NZ. Discover discounted styles, NZ Stock and tracked New Zealand delivery.",
  keywords: [
    "affordable sneakers NZ",
    "discounted shoes NZ",
    "cheap shoes NZ",
    "sneakers NZ",
    "retro runners NZ",
    "puffer jackets NZ",
    "streetwear NZ",
    "NZ Stock shoes",
  ],
  authors: [{ name: "MUSE NZ", url: getBaseURL() }],
  creator: "MUSE NZ",
  publisher: "MUSE NZ",
  category: "shopping",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "en_NZ",
    url: "/",
    siteName: "MUSE NZ",
    title: "MUSE NZ | Affordable Sneakers, Shoes & Streetwear",
    description:
      "Shop affordable sneakers, shoes, retro runners, puffers and streetwear with NZ Stock options and tracked New Zealand delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MUSE NZ | Affordable Sneakers, Shoes & Streetwear",
    description:
      "Affordable sneakers, discounted shoes, puffers and streetwear for New Zealand.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={inter.variable}>
      <body className="bg-muse-cream font-inter text-muse-black antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
