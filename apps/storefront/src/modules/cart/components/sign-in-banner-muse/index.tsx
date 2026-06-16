import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function SignInBanner() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-muse-border bg-muse-cream-warm px-[22px] py-[18px]">
      <div>
        <p className="mb-[3px] text-[14px] font-bold text-muse-black">
          Already have an account?
        </p>
        <p className="text-[12.5px] text-muse-text-muted">
          Sign in to access saved addresses, wishlist and order history.
        </p>
      </div>
      <LocalizedClientLink
        href="/account"
        className="whitespace-nowrap rounded-full bg-muse-black px-[22px] py-[11px] text-[12px] font-bold uppercase tracking-[0.08em] text-muse-cream transition hover:bg-muse-orange"
      >
        Sign in
      </LocalizedClientLink>
    </div>
  )
}
