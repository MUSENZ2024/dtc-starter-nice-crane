import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import {
  importLegacyOrderWorkflow,
  type ImportLegacyOrderWorkflowInput,
} from "../../../workflows/import-legacy-order"

const nullableText = z.string().nullish()
const address = z.object({
  first_name: nullableText,
  last_name: nullableText,
  address_1: nullableText,
  address_2: nullableText,
  city: nullableText,
  province: nullableText,
  postal_code: nullableText,
  country_code: nullableText,
  phone: nullableText,
})

export const PostAdminLegacyOrderSchema = z.object({
  source_order_id: z.string().min(1),
  created_at: z.string().datetime({ offset: true }),
  order: z.object({
    region_id: z.string(),
    customer_id: z.string(),
    sales_channel_id: z.string(),
    status: z.enum(["pending", "completed", "canceled"]),
    email: z.string().email(),
    currency_code: z.string().length(3),
    no_notification: z.literal(true),
    shipping_address: address.optional(),
    billing_address: address.optional(),
    items: z.array(z.object({
      title: z.string().min(1),
      quantity: z.number().positive(),
      unit_price: z.number(),
      variant_sku: nullableText,
      variant_title: nullableText,
      requires_shipping: z.boolean(),
      is_discountable: z.boolean(),
      is_tax_inclusive: z.boolean(),
      adjustments: z.array(z.object({
        code: z.string().optional(),
        amount: z.number(),
        description: z.string().optional(),
      })).optional(),
      tax_lines: z.array(z.object({
        code: z.string(),
        rate: z.number(),
        description: z.string().optional(),
      })).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })).min(1),
    shipping_methods: z.array(z.object({
      name: z.string(),
      amount: z.number(),
      is_tax_inclusive: z.boolean(),
      shipping_option_id: z.string().optional(),
      data: z.record(z.string(), z.unknown()).optional(),
    })).optional(),
    transactions: z.array(z.object({
      reference: z.string().optional(),
      reference_id: z.string().optional(),
      amount: z.number(),
      currency_code: z.string().length(3),
    })).optional(),
    metadata: z.record(z.string(), z.unknown()),
  }),
})

type PostAdminLegacyOrder = z.infer<typeof PostAdminLegacyOrderSchema>

export async function POST(
  req: MedusaRequest<PostAdminLegacyOrder>,
  res: MedusaResponse
) {
  const { result } = await importLegacyOrderWorkflow(req.scope).run({
    input: req.validatedBody as ImportLegacyOrderWorkflowInput,
  })
  res.status(200).json({ order: result })
}
