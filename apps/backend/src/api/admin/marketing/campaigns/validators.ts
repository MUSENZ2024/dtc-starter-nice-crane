import { z } from "zod"
export const CampaignBlockSchema = z.object({ type: z.enum(["hero","text","product_grid","category_row","review","offer","trust","divider"]) }).passthrough()
export const SaveCampaignSchema = z.object({ id: z.string().optional(), name: z.string().min(1).max(120), subject: z.string().min(1).max(180), preview_text: z.string().min(1).max(240), content: z.array(CampaignBlockSchema).min(1).max(30), audience_definition: z.record(z.string(), z.unknown()), utm_campaign: z.string().regex(/^[a-z0-9][a-z0-9-_]{2,79}$/i) })
export const ScheduleCampaignSchema = z.object({ scheduled_at: z.string().datetime(), confirmation: z.literal("CONFIRM CAMPAIGN"), override_allowance: z.boolean().optional() })
export const TestCampaignSchema = z.object({ to: z.string().email(), confirmation: z.literal("SEND TEST") })
export const ManageCampaignSchema = z.object({ action: z.enum(["pause","resume","cancel"]) })
export const UpdateMarketingControlSchema = z.object({ global_pause: z.boolean() })
export type SaveCampaignBody = z.infer<typeof SaveCampaignSchema>
export type ScheduleCampaignBody = z.infer<typeof ScheduleCampaignSchema>
export type TestCampaignBody = z.infer<typeof TestCampaignSchema>
export type ManageCampaignBody = z.infer<typeof ManageCampaignSchema>
export type UpdateMarketingControlBody = z.infer<typeof UpdateMarketingControlSchema>
