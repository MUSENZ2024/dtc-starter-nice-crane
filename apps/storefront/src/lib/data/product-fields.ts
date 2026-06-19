export const PRODUCT_LIST_FIELDS =
  "id,title,handle,status,subtitle,thumbnail,*collection,*type,*options,*variants.options,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+variants.metadata,+metadata,*tags"

export const PRODUCT_DETAIL_FIELDS =
  "id,title,handle,status,subtitle,description,thumbnail,*images,*collection,*type,*options,*options.values,*variants.options,*variants.images,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+variants.metadata,+metadata,*tags"
