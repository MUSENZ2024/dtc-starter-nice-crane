const PROOF_ITEMS = [
  {
    type: "video" as const,
    src: "/realproof/AQMKmIY6p2tnns4X9_1j51oMyymyQFEug_wvLVLswh3iK96VFFgmywO92ZyA1dQC9V-rcOO5X0bfaJ_T0DURtHXRXg6L-2moXTCR1W8.mp4",
    poster: "/realproof/videoframe_755.png",
  },
  {
    type: "image" as const,
    src: "/realproof/626460199_17962157423994934_9218799453926765843_n.jpg",
  },
  {
    type: "image" as const,
    src: "/realproof/580063289_18101820067735467_9027610100397158007_n.jpg",
  },
  {
    type: "image" as const,
    src: "/realproof/562998152_18079872514861173_8352883702044158535_n.jpg",
  },
  {
    type: "image" as const,
    src: "/realproof/639552729_17963916020994934_6353348850236910971_n.jpg",
  },
  {
    type: "image" as const,
    src: "/realproof/564831123_18047441489347978_1608318233264721454_n.jpg",
  },
  { type: "image" as const, src: "/realproof/videoframe_755.png" },
  {
    type: "image" as const,
    src: "/realproof/626459852_17962257686994934_6931010819832897641_n.jpg",
  },
  { type: "image" as const, src: "/realproof/videoframe_938.png" },
  {
    type: "image" as const,
    src: "/realproof/631274563_17963408489994934_4220081347609135448_n.jpg",
  },
]

export default function RealProofSection() {
  return (
    <section className="mb-20 overflow-hidden">
      <div className="mx-auto mb-7 flex max-w-[1320px] flex-col gap-4 px-[18px] small:flex-row small:items-end small:justify-between small:px-8">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
            Real proof
          </p>
          <h2 className="text-[34px] font-black leading-[0.98] tracking-[-0.045em] small:text-[52px]">
            Straight from our customers.
          </h2>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.65] text-[#666]">
            Real orders, real unboxings, and real fit photos from people who
            have shopped with us.
          </p>
        </div>
        <a
          href="https://www.instagram.com/muse.nz/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center gap-2.5 self-center rounded-full bg-[#0A0A0A] px-5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#F4F2ED] transition hover:bg-[#C1440E] small:h-[52px] small:self-end small:px-6 small:text-[12px]"
        >
          <img
            src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/ffa7a5bb-412b-4863-8621-280e76f1ffa1.png"
            alt=""
            className="h-5 w-5 object-contain"
          />
          Follow @muse.nz
        </a>
      </div>

      <div className="mx-auto flex max-w-[1320px] gap-[12px] overflow-x-auto px-[18px] [scroll-snap-type:x_mandatory] [scrollbar-width:none] small:gap-[14px] small:px-8 [&::-webkit-scrollbar]:hidden">
        {PROOF_ITEMS.map((item, index) => (
          <div
            key={`${item.src}-${index}`}
            className="flex-shrink-0 overflow-hidden rounded-[18px] bg-[#0A0A0A] [aspect-ratio:9/16] [scroll-snap-align:start] [width:calc((100vw-18px-24px)/3.15)] small:w-[220px] small:rounded-[22px] large:w-[260px]"
          >
            {item.type === "video" ? (
              <video
                src={item.src}
                poster={item.poster}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={item.src}
                alt="Customer photo"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
