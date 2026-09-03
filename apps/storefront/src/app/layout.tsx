import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Roboto, Roboto_Condensed } from "next/font/google"
import Script from "next/script"
import MetaPixel from "@modules/analytics/components/meta-pixel"
import { META_PIXEL_ID } from "@lib/meta-pixel"
import "styles/globals.css"
import "styles/retail-theme.css"

const GOOGLE_TAG_ID = "GT-M638GBXN"

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

const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700"],
})

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-condensed",
  weight: ["400", "700"],
})

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${roboto.variable} ${robotoCondensed.variable}`}
    >
      <body className="muse-retail-theme bg-muse-cream font-sans text-muse-black antialiased">
        <main className="relative">{props.children}</main>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_TAG_ID}');
          `}
        </Script>
        <MetaPixel />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </body>
    </html>
  )
}
