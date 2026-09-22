import { model } from "@medusajs/framework/utils"

const ItemRequest = model.define("item_request", {
  id: model.id().primaryKey(),
  item_name: model.text(),
  item_type: model.enum(["bag", "watch", "wallet", "accessory", "other"]),
  details: model.text().nullable(),
  requester_name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  image_url: model.text(),
  image_file_id: model.text(),
  status: model.enum(["pending", "reviewing", "quoted", "closed"]).default("pending"),
  admin_note: model.text().nullable(),
})

export default ItemRequest
