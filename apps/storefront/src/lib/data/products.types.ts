export type SortOptions =
  | "price_asc"
  | "price_desc"
  | "created_at"
  | "best_sellers"
  | "ships_soonest"

export type ProductFilterParams = {
  stock?: "nz-stock" | "standard-delivery"
  category_id?: string[]
  collection_id?: string[]
  tag_id?: string[]
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
