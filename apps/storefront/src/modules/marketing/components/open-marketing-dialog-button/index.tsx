"use client"

import { useMarketingOverlay } from "../../context/marketing-overlay-context"

export default function OpenMarketingDialogButton() {
  const { openMarketingDialog } = useMarketingOverlay()

  return (
    <button
      type="button"
      onClick={() => openMarketingDialog("homepage_drop_access")}
      className="mt-8 min-h-[56px] rounded-full bg-muse-yellow px-8 text-[12px] font-black uppercase tracking-[0.14em] text-muse-black transition hover:bg-muse-yellow-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-muse-yellow"
    >
      Choose my access
    </button>
  )
}
