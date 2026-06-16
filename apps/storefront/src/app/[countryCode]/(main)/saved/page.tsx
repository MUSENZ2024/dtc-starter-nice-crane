import { Metadata } from "next"

import SavedItemsClient from "./saved-items-client"

export const metadata: Metadata = {
  title: "Saved Items - MUSE NZ",
  description: "View the MUSE items you have saved on this device.",
}

export default function SavedItemsPage() {
  return (
    <main className="bg-[#F4F2ED] text-[#1A1A1A]">
      <SavedItemsClient />
    </main>
  )
}
