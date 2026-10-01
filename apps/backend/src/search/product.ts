import {
  defineSearchIndex,
  graphConsume,
  graphSeed,
  search,
} from "@medusajs/framework/utils"

const source = {
  fields: [
    "id",
    "title",
    "description",
    "handle",
    "thumbnail",
    "status",
    "categories.id",
    "categories.name",
    "categories.handle",
    "tags.id",
    "tags.value",
  ],
}

export const productIndex = defineSearchIndex({
  name: "product",
  entity: "product",
  fields: search.define({
    id: search.keyword().filterable(),
    title: search.text().searchable({ weight: 3 }),
    description: search.text().searchable(),
    handle: search.keyword().filterable(),
    thumbnail: search.keyword(),
    status: search.keyword().filterable().retrievable(false),
    categories: search
      .object({
        id: search.keyword().filterable(),
        name: search.keyword().searchable().facetable(),
        handle: search.keyword().filterable(),
      })
      .array(),
    tags: search
      .object({
        id: search.keyword().filterable(),
        value: search.keyword().searchable().facetable(),
      })
      .array(),
  }),
  events: ["product.created", "product.updated", "product.deleted"],
  consume: graphConsume(source),
  seed: graphSeed(source),
})
