import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { z } from "zod";
import { ABANDONED_CART_MODULE } from "../../../modules/abandoned-cart";
import AbandonedCartModuleService from "../../../modules/abandoned-cart/service";

const numberParam = (fallback: number) =>
  z.preprocess(
    (value) => (value == null ? fallback : Number(value)),
    z.number().int().min(0),
  );

export const GetAdminAbandonedCartsSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["active", "recovered", "expired", "cancelled"]).optional(),
  email_status: z
    .enum(["not_sent", "scheduled", "sending", "sent", "failed", "cancelled"])
    .optional(),
  segment: z.enum(["first_time", "returning"]).optional(),
  limit: numberParam(20).pipe(z.number().max(100)),
  offset: numberParam(0),
});

const numeric = (value: unknown) => {
  if (value && typeof value === "object" && "numeric_" in value)
    return Number((value as { numeric_: unknown }).numeric_) || 0;
  return Number(value) || 0;
};

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const service: AbandonedCartModuleService = req.scope.resolve(
    ABANDONED_CART_MODULE,
  );
  const { q, status, email_status, segment, limit, offset } =
    req.validatedQuery as z.infer<typeof GetAdminAbandonedCartsSchema>;
  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (email_status) filters.last_email_status = email_status;
  if (segment) filters.segment = segment;

  const all = await service.listAbandonedCartCampaigns(filters as any, {
    take: 10000,
    order: { abandoned_at: "DESC" },
  });
  const term = q?.trim().toLowerCase();
  const filtered = term
    ? all.filter((campaign) =>
        [campaign.customer_name, campaign.email, campaign.cart_id].some(
          (value) => value?.toLowerCase().includes(term),
        ),
      )
    : all;
  const campaigns = filtered.slice(offset, offset + limit).map((campaign) => ({
    ...campaign,
    cart_value: numeric(campaign.cart_value),
    free_shipping_remaining: numeric(campaign.free_shipping_remaining),
    recovered_revenue:
      campaign.recovered_revenue == null
        ? null
        : numeric(campaign.recovered_revenue),
  }));
  const stats = {
    active: all.filter((campaign) => campaign.status === "active").length,
    awaiting_email: all.filter(
      (campaign) =>
        campaign.status === "active" &&
        ["not_sent", "scheduled"].includes(campaign.last_email_status),
    ).length,
    emails_sent: all.filter((campaign) => Boolean(campaign.first_email_sent_at))
      .length,
    recovered: all.filter((campaign) => campaign.status === "recovered").length,
    recovered_revenue: all.reduce(
      (sum, campaign) => sum + numeric(campaign.recovered_revenue),
      0,
    ),
  };

  res.json({ campaigns, count: filtered.length, limit, offset, stats });
}
