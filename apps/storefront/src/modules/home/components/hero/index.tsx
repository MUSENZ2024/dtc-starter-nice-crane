import LocalizedClientLink from "@modules/common/components/localized-client-link";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[#F6F3EA]">
      <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#C8D050]/30 blur-3xl" />
      <div className="content-container relative grid min-h-[76vh] gap-10 py-10 small:grid-cols-[1.02fr_0.98fr] small:items-center small:py-20">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/60 backdrop-blur">
            4.9 rated · Auckland pickup · 30-day money back
          </div>
          <h1 className="max-w-3xl text-[48px] font-black leading-[0.95] tracking-[-0.05em] text-[#0A0A0A] small:text-[86px]">
            The winter pieces people keep asking for.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-black/65 small:text-lg">
            Curated footwear and outerwear with clean product pages, honest
            delivery timelines, and NZ Post tracking from the moment your order
            moves.
          </p>
          <div className="mt-8 flex flex-col gap-3 xsmall:flex-row">
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-14 items-center justify-center rounded-full bg-black px-8 text-[12px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#C8D050] hover:text-black"
            >
              Shop best sellers
            </LocalizedClientLink>
            <a
              href="https://www.musenz.com/track"
              className="inline-flex h-14 items-center justify-center rounded-full border border-black/15 bg-white/70 px-8 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition hover:border-black"
            >
              Track an order
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-[32px] bg-black p-3 shadow-2xl shadow-black/20">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#DAD4C5]">
              <img
                src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=80"
                alt="Black puffer jacket styling"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-3xl bg-white/80 p-4 shadow-xl backdrop-blur-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/50">
                  Featured drop
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="text-xl font-black tracking-[-0.03em] text-black">
                    1996 Retro Puffer
                  </p>
                  <p className="shrink-0 rounded-full bg-black px-4 py-2 text-sm font-bold text-[#C8D050]">
                    NZ$180
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-4 rounded-3xl bg-[#C8D050] px-5 py-4 text-sm font-bold text-black shadow-xl">
            Ships with live tracking
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
