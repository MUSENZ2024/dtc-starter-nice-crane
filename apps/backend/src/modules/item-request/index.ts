import { Module } from "@medusajs/framework/utils"
import ItemRequestModuleService from "./service"

export const ITEM_REQUEST_MODULE = "itemRequest"

export default Module(ITEM_REQUEST_MODULE, {
  service: ItemRequestModuleService,
})
