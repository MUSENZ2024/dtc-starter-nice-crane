import { z } from "@medusajs/framework/zod";

const ShipmentItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
});

const TrackingLabelSchema = z.object({
  tracking_number: z
    .string()
    .trim()
    .min(1, "Enter a tracking number before marking the order as shipped."),
  tracking_url: z.string().optional(),
  label_url: z.string().optional(),
});

export const PostAdminCreateTrackedShipmentSchema = z.object({
  items: z.array(ShipmentItemSchema),
  labels: z
    .array(TrackingLabelSchema)
    .min(1, "Add a tracking number before marking the order as shipped."),
  no_notification: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  additional_data: z.record(z.string(), z.unknown()).nullish(),
});

export const PostAdminAttachTrackingSchema = z.object({
  tracking_number: z.string().trim().min(1).max(200),
  tracking_url: z.url().optional(),
  send_notification: z.boolean().default(true),
});

export type PostAdminAttachTrackingSchema = z.infer<
  typeof PostAdminAttachTrackingSchema
>;
