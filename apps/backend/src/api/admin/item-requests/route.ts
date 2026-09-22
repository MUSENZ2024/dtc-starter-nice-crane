import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ITEM_REQUEST_MODULE } from "../../../modules/item-request"
import ItemRequestModuleService from "../../../modules/item-request/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: ItemRequestModuleService = req.scope.resolve(ITEM_REQUEST_MODULE)
  const requests = await service.listItemRequests({}, { order: { created_at: "DESC" } })
  res.json({ requests, count: requests.length })
}
