import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { ITEM_REQUEST_MODULE } from "../../modules/item-request"
import ItemRequestModuleService from "../../modules/item-request/service"

export type UpdateItemRequestInput = {
  id: string
  status: "pending" | "reviewing" | "quoted" | "closed"
  admin_note?: string
}

export const updateItemRequestStep = createStep(
  "update-item-request",
  async (input: UpdateItemRequestInput, { container }) => {
    const service: ItemRequestModuleService = container.resolve(ITEM_REQUEST_MODULE)
    const previous = await service.retrieveItemRequest(input.id)
    const request = await service.updateItemRequests(input)
    return new StepResponse(request, {
      id: previous.id,
      status: previous.status,
      admin_note: previous.admin_note,
    })
  },
  async (previous, { container }) => {
    if (!previous) return
    const service: ItemRequestModuleService = container.resolve(ITEM_REQUEST_MODULE)
    await service.updateItemRequests(previous)
  }
)
