"use client"

import { useSavedItems } from "@lib/context/saved-items-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HeartIcon } from "@modules/saved/components/saved-toggle"

export default function SavedItemsClient() {
  const { items, hydrated, removeSaved, clearSaved } = useSavedItems()

  if (!hydrated) {
    return (
      <section className="mx-auto min-h-[520px] max-w-[1180px] px-[18px] py-16 small:px-8">
        <div className="h-64 animate-pulse rounded-[18px] bg-[#F8F7F4]" />
      </section>
    )
  }

  if (!items.length) {
    return (
      <section className="mx-auto flex min-h-[520px] max-w-[720px] flex-col items-center justify-center px-[18px] py-16 text-center small:px-8">
        <HeartIcon saved={false} className="mb-5 h-9 w-9 text-[#0A0A0A]" />
        <h1 className="mb-3 text-[28px] font-black tracking-[-0.03em] text-[#0A0A0A] small:text-[38px]">
          You have no Saved Items
        </h1>
        <p className="mb-7 max-w-[360px] text-[15px] leading-7 text-[#666]">
          Sign in to sync your Saved Items across all your devices.
        </p>
        <div className="flex flex-col gap-3 small:flex-row">
          <LocalizedClientLink
            href="/account"
            className="rounded-full bg-[#0A0A0A] px-9 py-4 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white"
          >
            Sign in
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="rounded-full border-[1.5px] border-[#D5D2CC] bg-white px-9 py-4 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A]"
          >
            Shop all
          </LocalizedClientLink>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-[1180px] px-[18px] py-10 small:px-8 small:py-14">
      <div className="mb-8 flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C1440E]">
            Saved Items
          </p>
          <h1 className="text-[32px] font-black tracking-[-0.04em] text-[#0A0A0A] small:text-[48px]">
            Your saved items
          </h1>
          <p className="mt-2 max-w-[520px] text-[14px] leading-7 text-[#666]">
            These are saved on this device. Sign in to sync your Saved Items
            across all your devices.
          </p>
        </div>
        <button
          type="button"
          onClick={clearSaved}
          className="self-start border-b-2 border-[#0A0A0A] pb-0.5 text-[12px] font-extrabold uppercase tracking-[0.08em]"
        >
          Clear saved
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 small:grid-cols-3 small:gap-5 medium:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-[20px] bg-[#F8F7F4] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
          >
            <div className="relative aspect-square overflow-hidden bg-[#E8E6E0]">
              <LocalizedClientLink href={item.href} className="block h-full">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[42px] font-black text-black/[0.08]">
                    MUSE
                  </span>
                )}
              </LocalizedClientLink>
              {item.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-[#F4F2ED]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em]">
                  {item.badge}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeSaved(item.id)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F2ED]/95 text-[#C1440E] backdrop-blur transition hover:scale-105"
                aria-label={`Remove ${item.title} from saved items`}
              >
                <HeartIcon saved className="h-4 w-4" />
              </button>
            </div>
            <LocalizedClientLink href={item.href} className="block px-4 pb-4 pt-3">
              <p className="mb-1.5 line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#0A0A0A]">
                {item.title}
              </p>
              <div className="mb-1.5 flex items-baseline gap-2">
                {item.price && (
                  <span className="text-[15px] font-extrabold text-[#0A0A0A]">
                    {item.price}
                  </span>
                )}
                {item.compareAt && (
                  <span className="text-[12px] text-[#999] line-through">
                    {item.compareAt}
                  </span>
                )}
              </div>
              {item.eta && (
                <p className="text-[11px] text-[#777]">{item.eta}</p>
              )}
            </LocalizedClientLink>
          </article>
        ))}
      </div>
    </section>
  )
}
