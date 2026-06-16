import { Metadata } from "next"

import TrackingClient from "./tracking-client"

export const metadata: Metadata = {
  title: "Track Your Order - MUSE NZ",
  description:
    "Track your MUSE NZ order. Live status, estimated delivery, and the full journey from overseas to your door.",
}

export default function TrackPage() {
  return <TrackingClient />
}
