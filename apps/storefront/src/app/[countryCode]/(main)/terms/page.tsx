import { Metadata } from "next"

import StaticPage from "@modules/content/muse-static-pages/static-page"
import { termsHtml } from "@modules/content/muse-static-pages/terms.html"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "MUSE NZ Terms of Service. Read our terms for ordering, returns, payments, and using our website. Governed by New Zealand law.",
  alternates: {
    canonical: "/terms",
  },
}

export default function Page() {
  return <StaticPage html={termsHtml} variant="legal" />
}
