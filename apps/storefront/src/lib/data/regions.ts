"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

export const listRegions = cache(async () => {
  return await sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next: { revalidate: 300 },
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    .catch(() => [])
})

export const retrieveRegion = async (id: string) => {
  return await sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next: { revalidate: 300 },
      cache: "force-cache",
    })
    .then(({ region }) => region)
}

// Request-scoped memoization coalesces concurrent component lookups. The fetch
// cache above expires after five minutes; a process-global Map never expired.
export const getRegion = cache(async (countryCode: string) => {
  const regions = await listRegions()
  const code = (countryCode || "us").toLowerCase()
  return (
    regions.find((region) =>
      region.countries?.some((country) => country.iso_2 === code)
    ) ?? null
  )
})
