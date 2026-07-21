import { z } from "zod"
export const SegmentRuleSchema = z.object({ field: z.enum(["status","source_first","source_latest","primary_preference","customer_type","order_count","lifetime_revenue","signup_days_ago","engaged_days_ago","clicked_within_days","opened_within_days","offer_redeemed","received_campaign","entered_flow"]), operator: z.enum(["eq","neq","in","not_in","gt","gte","lt","lte","true","false"]), value: z.unknown().optional() })
export const SaveSegmentSchema = z.object({ id: z.string().optional(), key: z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/), name: z.string().min(1).max(120), description: z.string().max(500).nullable().optional(), definition: z.object({ operator: z.enum(["and","or"]).default("and"), rules: z.array(SegmentRuleSchema).min(1).max(20) }) })
export const EstimateSegmentSchema = z.object({ definition: SaveSegmentSchema.shape.definition })
export type SaveSegmentBody = z.infer<typeof SaveSegmentSchema>
export type EstimateSegmentBody = z.infer<typeof EstimateSegmentSchema>
