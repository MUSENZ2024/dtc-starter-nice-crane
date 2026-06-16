import { Metadata } from "next"

import { privacyHtml } from "@modules/content/muse-static-pages/privacy.html"
import StaticPage from "@modules/content/muse-static-pages/static-page"

export const metadata: Metadata = {
  title: "Privacy Policy — MUSE NZ",
  description:
    "MUSE NZ Privacy Policy. How we collect, use, and protect your personal information under the New Zealand Privacy Act 2020.",
}

export default function Page() {
  return <StaticPage html={privacyHtml} variant="legal" />
}
