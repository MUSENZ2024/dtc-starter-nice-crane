import { createInstantSearchAdapter } from "@medusajs/instantsearch-adapter"
import { sdk } from "./config"

export const PRODUCT_SEARCH_INDEX = "product"

export const { searchClient } = createInstantSearchAdapter({
  // The adapter intentionally exposes the small SDK fetch surface it needs;
  // Medusa's fetch generics are wider than that structural contract.
  sdk: sdk as never,
  path: "/store/search",
  placeholderSearch: false,
  indexSpecificSearchParameters: {
    [PRODUCT_SEARCH_INDEX]: {
      fields: ["id", "title", "handle", "thumbnail"],
    },
  },
  additionalSearchParameters: {
    search_options: {
      match_strategy: "last",
      typo_tolerance: true,
    },
  },
})
