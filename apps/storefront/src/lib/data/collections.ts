"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

export const retrieveCollection = async (id: string) => {
  return await sdk.client
    .fetch<{ collection: HttpTypes.StoreCollection }>(
      `/store/collections/${id}`,
      {
        next: { revalidate: 300 },
        cache: "force-cache",
      }
    )
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  const query = {
    // Collection selectors and route generation only need identity fields.
    // Fetching *products made this shared response exceed Next's 2 MB cache
    // limit, turning a supposedly cached lookup into repeated network work.
    fields: "id,title,handle",
    limit: "100",
    offset: "0",
    ...queryParams,
  }

  return await sdk.client
    .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
      "/store/collections",
      {
        query,
        next: { revalidate: 300 },
        cache: "force-cache",
      }
    )
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection | null> => {
  return await sdk.client
    .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
      query: { handle, fields: "id,title,handle" },
      next: { revalidate: 300 },
      cache: "force-cache",
    })
    .then(({ collections }) => collections[0] || null)
}
