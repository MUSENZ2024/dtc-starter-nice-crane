import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { ITEM_REQUEST_MODULE } from "../../modules/item-request"
import ItemRequestModuleService from "../../modules/item-request/service"

export type CreateItemRequestInput = {
  item_name: string
  item_type: "bag" | "watch" | "wallet" | "accessory" | "other"
  details?: string
  requester_name: string
  email: string
  phone?: string
  image: { filename: string; mime_type: string; content: string }
}

type FileService = {
  createFiles(input: { filename: string; mimeType: string; content: string; access: "public" }): Promise<{ id: string; url: string }>
  deleteFiles(id: string): Promise<void>
}

export const createItemRequestStep = createStep(
  "create-item-request",
  async (input: CreateItemRequestInput, { container }) => {
    const fileService = container.resolve<FileService>(Modules.FILE)
    const requestService: ItemRequestModuleService = container.resolve(ITEM_REQUEST_MODULE)
    const file = await fileService.createFiles({
      filename: input.image.filename,
      mimeType: input.image.mime_type,
      content: input.image.content,
      access: "public",
    })

    try {
      const request = await requestService.createItemRequests({
        item_name: input.item_name,
        item_type: input.item_type,
        details: input.details,
        requester_name: input.requester_name,
        email: input.email,
        phone: input.phone,
        image_url: file.url,
        image_file_id: file.id,
        status: "pending",
      })
      return new StepResponse(request, { request_id: request.id, file_id: file.id })
    } catch (error) {
      await fileService.deleteFiles(file.id)
      throw error
    }
  },
  async (compensation, { container }) => {
    if (!compensation) return
    const fileService = container.resolve<FileService>(Modules.FILE)
    const requestService: ItemRequestModuleService = container.resolve(ITEM_REQUEST_MODULE)
    await requestService.deleteItemRequests(compensation.request_id)
    await fileService.deleteFiles(compensation.file_id)
  }
)
