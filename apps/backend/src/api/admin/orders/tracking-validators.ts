import { z } from "@medusajs/framework/zod"

const TrackingLabelSchema = z.looseObject({
  tracking_number: z
    .string()
    .trim()
    .min(1, "Enter a tracking number before marking the order as shipped.")
})

export const PostAdminCreateTrackedShipmentSchema = z.looseObject({
  labels: z
    .array(TrackingLabelSchema)
    .min(1, "Add a tracking number before marking the order as shipped.")
})

export const PostAdminAttachTrackingSchema = z.object({
  tracking_number: z.string().trim().min(1).max(200),
  tracking_url: z.url().optional(),
  send_notification: z.boolean().default(true)
})

export type PostAdminAttachTrackingSchema = z.infer<
  typeof PostAdminAttachTrackingSchema
>
