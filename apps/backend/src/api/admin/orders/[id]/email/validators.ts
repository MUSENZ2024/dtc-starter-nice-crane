import { z } from "@medusajs/framework/zod"

export const OrderEmailSchema = z.object({
  template: z.literal("order_confirmation"),
  note: z.string().trim().max(2000).optional(),
})

export type OrderEmailInput = z.infer<typeof OrderEmailSchema>
