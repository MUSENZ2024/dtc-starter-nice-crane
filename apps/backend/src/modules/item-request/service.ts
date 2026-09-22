import { MedusaService } from "@medusajs/framework/utils"
import ItemRequest from "./models/item-request"

class ItemRequestModuleService extends MedusaService({ ItemRequest }) {}

export default ItemRequestModuleService
