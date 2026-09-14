import { Metadata } from "next"

import SavedItemsClient from "./saved-items-client"

export const metadata: Metadata = {
  title: "Saved Items - MUSE NZ",
  description: "View the MUSE items you have saved on this device.",
}

export default function SavedItemsPage() {
  return (
    <div className="muse-saved-restyle bg-white text-[#1A1A1A]">
      <SavedItemsClient />
    </div>
  )
}
