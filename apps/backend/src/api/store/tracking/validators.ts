import { z } from "@medusajs/framework/zod";

export const PostStoreTrackingLookupSchema = z.object({
  tracking_number: z
    .string()
    .trim()
    .toUpperCase()
    .min(8)
    .max(30)
    .regex(/^(?:[A-Z]{2}\d{9}[A-Z]{2}|\d{8,30}|(?=.*\d)[A-Z0-9]{10,30})$/),
});

export type PostStoreTrackingLookup = z.infer<
  typeof PostStoreTrackingLookupSchema
>;
