import { z } from "@medusajs/framework/zod"

export const UpdateEmailTemplateSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  html: z.string().trim().min(1).max(100000),
  enabled: z.boolean(),
  delay_minutes: z.number().int().min(0).max(43200),
})

export type UpdateEmailTemplateInput = z.infer<typeof UpdateEmailTemplateSchema>
