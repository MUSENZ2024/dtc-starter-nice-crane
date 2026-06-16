import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  total: number
  currencyCode: string
}

export default function MobileCheckoutBar({ total, currencyCode }: Props) {
  const formatted = convertToLocale({
    amount: total,
    currency_code: currencyCode,
  })

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] flex flex-col gap-2 border-t border-muse-border bg-muse-cream px-[18px] pb-[18px] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-muse-text-muted">
          Total (incl. GST)
        </span>
        <span className="text-[20px] font-black tracking-tight text-muse-black">
          {formatted}
        </span>
      </div>
      <LocalizedClientLink
        href="/checkout"
        className="flex w-full items-center justify-center gap-2.5 rounded-full bg-muse-black px-6 py-[18px] text-[14px] font-extrabold uppercase tracking-[0.08em] text-muse-cream transition hover:bg-muse-orange"
      >
        Go to checkout →
      </LocalizedClientLink>
    </div>
  )
}
