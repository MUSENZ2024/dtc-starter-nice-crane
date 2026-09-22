export function AccessoriesSourcingNotice() {
  return (
    <aside aria-labelledby="accessories-sourcing-title" className="border-b border-muse-border bg-muse-cream-warm">
      <div className="mx-auto max-w-[1400px] px-[18px] py-6 small:px-8">
        <h2 id="accessories-sourcing-title" className="font-condensed text-[26px] leading-tight">We can source more styles than you see here.</h2>
        <p className="mt-2 max-w-[850px] text-[15px] leading-7 text-muse-text-muted">We list styles we’ve brought in before. We can source most mainstream bags and watches, including styles you won’t find on our website. Fill in the form below with the item you want and we’ll check availability and give you a quote.</p>
        <a href="#request-an-item" className="mt-3 inline-flex min-h-11 items-center font-bold text-[14px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Request a quote</a>
      </div>
    </aside>
  )
}

const questions = [
  {
    question: "What quality are the bags?",
    answer: "We source bags with medium to high build quality. We aim to choose bags you can use for 3–4 years, depending on wear and care. We pay more to source this level of quality, so our prices are higher than budget replicas.",
  },
  {
    question: "Can I request a bag or watch you haven’t listed?",
    answer: "Yes. We can source most mainstream bags and watches. Our listings show styles we’ve brought in before. Send us the style you want through the request form and we’ll check availability and give you a quote.",
  },
  {
    question: "What should I include in my request?",
    answer: "Add the item name and a clear photo or screenshot, then your name and email so we can contact you. You can also add the colour, size, model or a product link to help us find the right item.",
  },
  {
    question: "How soon will I receive a quote?",
    answer: "Expect a quote within 24–48 hours of submitting your request.",
  },
  {
    question: "Can I see photos before I buy?",
    answer: "Yes. If our supplier has photos of the item, we’ll email them to you so you can check the details before you buy.",
  },
  {
    question: "Can I collect my order in Auckland?",
    answer: "Yes. We can order your item and have it shipped to our Auckland warehouse for pickup. Let us know you’d like to collect it when you submit your request.",
  },
  {
    question: "What happens if my item arrives damaged or differs from what we agreed?",
    answer: "MUSE offers 30-day returns. Email support@musenz.com about the issue and we’ll provide a free return label so you can send the item back.",
  },
]

export function AccessoriesFaq() {
  return (
    <section aria-labelledby="accessories-faq-title" className="border-t border-muse-border bg-white">
      <div className="mx-auto max-w-[1400px] px-[18px] py-10 small:px-8 small:py-14">
        <h2 id="accessories-faq-title" className="font-condensed text-[32px] leading-tight">Bags & accessories FAQ</h2>
        <div className="mt-6 max-w-[850px] border-t border-muse-border">
          {questions.map(({ question, answer }, index) => (
            <details key={question} open={index === 0} className="group border-b border-muse-border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-4 text-[16px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
                {question}<span aria-hidden="true" className="shrink-0 text-xl group-open:rotate-45">+</span>
              </summary>
              <p className="pb-6 pr-6 text-[15px] leading-7 text-muse-text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
