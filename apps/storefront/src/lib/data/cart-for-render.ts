import "server-only"

import { cache } from "react"
import { retrieveCart } from "./cart"

// Only share reads within a Server Component render, never across customers or
// across requests. Mutation/recovery flows continue to use uncached retrieveCart.
export const retrieveCartForRender = cache(retrieveCart)
