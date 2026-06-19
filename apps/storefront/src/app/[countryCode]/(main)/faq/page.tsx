import { Metadata } from "next"
import { notFound } from "next/navigation"

import FaqPage from "@modules/content/muse-static-pages/faq-page"

export const metadata: Metadata = {
  title: "FAQ — MUSE NZ",
  description:
    "Got a question about your order, shipping, returns, or our products? Find your answer here. MUSE NZ help centre.",
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    ["Are your products authentic?", "All MUSE NZ products are Unauthorized Authentic (UA). They are made with the same materials and in the same factories as officially branded items, just without brand authorisation. That is how we keep prices well below retail."],
    ["How long does Standard Delivery take?", "Standard Delivery orders take 13 to 16 business days from when you order to when it arrives at your door in New Zealand. Every order is fully tracked the whole way."],
    ["How do I return or exchange my order?", "Email support@musenz.com within 7 business days of receiving your order. Include your order number and reason. Items must be unworn, in brand-new condition, with the original box undamaged."],
    ["Do I need an account to order?", "No. Guest checkout is fine. Your order confirmation and tracking will be sent to your email."],
    ["Is GST included in the price?", "Yes. All prices include NZ GST (15%). No extra charges at checkout."],
    ["Will I pay customs or import duties?", "No. For NZ buyers there are no customs charges. The price at checkout is the total you pay."],
    ["How do I track my order?", "Once dispatched you will get an email with your tracking number. Use it on our Tracking page or directly on the NZ Post website."],
  ].map(([name, text]) => ({
    "@type": "Question",
    name,
    acceptedAnswer: { "@type": "Answer", text },
  })),
}

export default function Page() {
  notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FaqPage />
    </>
  )
}
