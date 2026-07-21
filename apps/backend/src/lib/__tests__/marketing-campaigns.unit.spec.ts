import { estimateSegment, materializeAudience, matchesSegment } from "../marketing-segments"
import { renderCampaignEmail, validateCampaignContent } from "../marketing-campaign-email"

describe("marketing campaign safeguards", () => {
  const subscribers = [
    { id:"s1", email_normalized:"one@example.com", status:"subscribed", primary_preference:"footwear", order_count:0, subscribed_at:"2026-07-20T00:00:00Z" },
    { id:"s2", email_normalized:"two@example.com", status:"unsubscribed", primary_preference:"footwear", order_count:0, subscribed_at:"2026-07-20T00:00:00Z" },
    { id:"s3", email_normalized:"three@example.com", status:"suppressed", primary_preference:"footwear", order_count:0, subscribed_at:"2026-07-20T00:00:00Z" },
  ]
  const definition = { operator:"and" as const, rules:[{field:"primary_preference",operator:"eq",value:"footwear"}] }
  test("evaluates reusable segment definitions", () => expect(estimateSegment(subscribers, definition)).toHaveLength(3))
  test("materialised audience always excludes unsubscribed and suppressed profiles", () => { const rows=materializeAudience({subscribers,matchedIds:new Set(["s1","s2","s3"]),recentlySentIds:new Set(),campaignId:"c1"}); expect(rows.find(r=>r.subscriber_id==="s1")?.status).toBe("scheduled"); expect(rows.find(r=>r.subscriber_id==="s2")?.exclusion_reason).toBe("unsubscribed"); expect(rows.find(r=>r.subscriber_id==="s3")?.exclusion_reason).toBe("suppressed") })
  test("snapshot is stable and contains no duplicate recipients", () => { const input={subscribers:[subscribers[0],subscribers[0]],matchedIds:new Set(["s1"]),recentlySentIds:new Set<string>(),campaignId:"c1"}; expect(materializeAudience(input)).toEqual(materializeAudience(input)); expect(materializeAudience(input)).toHaveLength(1) })
  test("frequency cap excludes recently mailed profiles", () => expect(materializeAudience({subscribers:[subscribers[0]],matchedIds:new Set(["s1"]),recentlySentIds:new Set(["s1"]),campaignId:"c1"})[0].exclusion_reason).toBe("frequency_cap"))
  test("structured renderer rejects arbitrary blocks and includes unsubscribe", () => { expect(validateCampaignContent([{type:"html",body:"<script>"}])).toHaveLength(1); const html=renderCampaignEmail({subject:"Drop",previewText:"Preview",blocks:[{type:"text",heading:"Hello",body:"World"}],unsubscribeUrl:"https://store.musenz.com/marketing/unsubscribe",utmCampaign:"drop"}); expect(html).toContain("Unsubscribe"); expect(html).not.toContain("<script>") })
  test("boolean engagement rules are explicit", () => expect(matchesSegment(subscribers[0], {rules:[{field:"offer_redeemed",operator:"false"}]},{issuances:[]})).toBe(true))
})
