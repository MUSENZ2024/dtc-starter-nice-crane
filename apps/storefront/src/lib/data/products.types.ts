export type SortOptions =
  | "price_asc"
  | "price_desc"
  | "created_at"
  | "best_sellers"
  | "ships_soonest"
  | "random"

export type ProductFilterParams = {
  /** Override catalogue caching for pages that must reflect stock changes immediately. */
  revalidateSeconds?: number
  /** Keep purchasable products ahead of fully sold-out products before pagination. */
  prioritizeAvailable?: boolean
  stock?: "nz-stock" | "standard-delivery"
  nz_stock_collection_id?: string
  category_id?: string[]
  collection_id?: string[]
  tag_id?: string[]
  /** Each group is OR-ed; separate groups are AND-ed. */
  tag_filter_groups?: string[][]
  colour_tag_id?: string[]
  tag_product_ids?: Record<string, string[]>
  q?: string
  sizes?: string[]
  colours?: string[]
  colourTagFilterApplied?: boolean
  priceMax?: number
  priceMin?: number
  sortBy?: SortOptions
  page?: number
  limit?: number
}
