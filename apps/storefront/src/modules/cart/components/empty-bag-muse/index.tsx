import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function EmptyBagMuse() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muse-cream-warm">
        <svg
          className="h-9 w-9 stroke-muse-text-light"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.5"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
      <h2 className="text-[22px] font-black tracking-tight text-muse-black">
        Your bag is empty
      </h2>
      <p className="max-w-[300px] text-[15px] leading-relaxed text-muse-text-muted">
        Head back to the shop to find something you like.
      </p>
      <LocalizedClientLink
        href="/store"
        className="mt-2 inline-block rounded-full bg-muse-black px-9 py-4 text-[13px] font-bold uppercase tracking-[0.08em] text-muse-cream transition hover:bg-muse-orange"
      >
        Continue shopping →
      </LocalizedClientLink>
    </div>
  )
}
