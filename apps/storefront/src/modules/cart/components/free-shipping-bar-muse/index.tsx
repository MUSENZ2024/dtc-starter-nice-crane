type Props = {
  subtotal: number
  threshold: number
}

export default function FreeShippingBar({ subtotal, threshold }: Props) {
  const gap = Math.max(0, threshold - subtotal)
  const pct = Math.min(100, (subtotal / threshold) * 100)
  const unlocked = gap === 0

  return (
    <div className="mb-5 rounded-[18px] border border-muse-border bg-muse-cream-warm px-5 py-4">
      <p className="mb-2.5 text-[13px] leading-snug text-muse-text">
        {unlocked ? (
          <strong className="text-muse-green">
            🎉 You&apos;ve unlocked free NZ delivery!
          </strong>
        ) : (
          <>
            You&apos;re{" "}
            <strong className="text-muse-black">
              ${Math.round(gap)}
            </strong>{" "}
            away from{" "}
            <strong className="text-muse-green">free NZ delivery</strong>
          </>
        )}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-muse-border">
        <div
          className="h-full rounded-full bg-muse-green transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
