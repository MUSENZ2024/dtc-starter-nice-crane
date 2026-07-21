import { z } from "@medusajs/framework/zod"
import {
  MARKETING_CAPTURE_EVENT_TYPES,
  MARKETING_PREFERENCES,
  MARKETING_SOURCES,
} from "../../../modules/marketing/types"
import { MARKETING_CONSENT_VERSION } from "../../../lib/marketing-consent"

export const PostStoreMarketingSubscribeSchema = z.object({
  email: z.string().trim().email().max(320),
  preference: z.enum(MARKETING_PREFERENCES).default("everything"),
  source: z.enum(MARKETING_SOURCES),
  consent_version: z.literal(MARKETING_CONSENT_VERSION),
  session_id: z.string().trim().min(8).max(128).optional(),
  country_code: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
})

export type PostStoreMarketingSubscribe = z.infer<
  typeof PostStoreMarketingSubscribeSchema
>

export const PostStoreMarketingUnsubscribeSchema = z.object({
  token: z.string().min(20).max(2048),
})

export type PostStoreMarketingUnsubscribe = z.infer<
  typeof PostStoreMarketingUnsubscribeSchema
>

export const PostStoreMarketingPreferencesSchema = z.object({
  preference: z.enum(MARKETING_PREFERENCES).optional(),
  unsubscribe: z.boolean().optional().default(false),
}).refine((value) => value.preference || value.unsubscribe, {
  message: "Choose a preference or unsubscribe",
})

export type PostStoreMarketingPreferences = z.infer<
  typeof PostStoreMarketingPreferencesSchema
>

export const PostStoreMarketingEventSchema = z.object({
  session_id: z.string().trim().min(8).max(128),
  event_type: z.enum(MARKETING_CAPTURE_EVENT_TYPES),
  source: z.enum(MARKETING_SOURCES),
  preference: z.enum(MARKETING_PREFERENCES).optional(),
  page_type: z.enum(["home", "product", "store", "collection", "other"]),
  device_type: z.enum(["mobile", "desktop"]),
})

export type PostStoreMarketingEvent = z.infer<typeof PostStoreMarketingEventSchema>
