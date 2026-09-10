import { z } from "@medusajs/framework/zod"

const ImportSubscriberSchema = z.object({
  email: z.email(),
  first_name: z.string().trim().max(255).nullable().optional(),
  last_name: z.string().trim().max(255).nullable().optional(),
  customer_id: z.string().trim().max(255).nullable().optional(),
  order_count: z.number().int().min(0),
  lifetime_revenue: z.number().min(0),
  first_order_at: z.iso.datetime().nullable().optional(),
  last_order_at: z.iso.datetime().nullable().optional(),
  order_sources: z.array(z.enum(["medusa", "squarespace", "unknown"])).min(1),
})

export const ImportMarketingSubscribersSchema = z.object({
  confirmation: z.literal("IMPORT AUTHORIZED ORDER CUSTOMERS"),
  import_id: z.string().trim().min(1).max(120),
  permission_basis: z.string().trim().min(1).max(500),
  subscribers: z.array(ImportSubscriberSchema).min(1).max(100),
})

export type ImportMarketingSubscribersSchema = z.infer<typeof ImportMarketingSubscribersSchema>
