import { pretty, render } from "@react-email/render";
import {
  AbandonedCartTemplate,
  type AbandonedCartEmailItem,
  type AbandonedCartTemplateProps,
} from "../emails/AbandonedCartTemplate";
import { AbandonedCartPersonalTemplate } from "../emails/AbandonedCartPersonalTemplate";
import { AbandonedCartUrgencyTemplate } from "../emails/AbandonedCartUrgencyTemplate";

export const ABANDONED_CART_EMAILS = {
  1: {
    templateKey: "visual_reminder",
    subject: "MUSE: Your order is ready to ship 📦",
  },
  2: {
    templateKey: "personal_follow_up",
    subject: "Did you need help with your MUSE order?",
  },
  3: {
    templateKey: "urgency_reminder",
    subject: "Your MUSE cart won’t stay available",
  },
} as const;

export type AbandonedCartSequenceNumber = keyof typeof ABANDONED_CART_EMAILS;

export type AbandonedCartSnapshot = {
  cart_id: string;
  email: string;
  customer_id?: string | null;
  customer_name: string;
  segment: "first_time" | "returning";
  checkout_stage: "cart" | "checkout";
  currency_code: string;
  total: number;
  item_count: number;
  free_shipping_qualified: boolean;
  free_shipping_remaining: number;
  created_at?: string | null;
  updated_at: string;
  shipping_address?: Record<string, unknown> | null;
  billing_address?: Record<string, unknown> | null;
  shipping_methods?: unknown[] | null;
  payment_collection?: Record<string, unknown> | null;
  items: AbandonedCartEmailItem[];
};

export function buildAbandonedCartRecoveryUrl(
  cartId: string,
  trackingToken: string,
) {
  const storefrontUrl = (
    process.env.STOREFRONT_URL || "https://musenz.com"
  ).replace(/\/$/, "");
  return `${storefrontUrl}/nz/cart/recover/${encodeURIComponent(cartId)}?ac=${encodeURIComponent(trackingToken)}`;
}

export async function renderAbandonedCartEmail(
  snapshot: AbandonedCartSnapshot,
  sequenceNumber: AbandonedCartSequenceNumber,
  trackingToken: string,
) {
  const props: AbandonedCartTemplateProps = {
    customerName: snapshot.customer_name || "there",
    currencyCode: snapshot.currency_code || "nzd",
    items: snapshot.items,
    recoveryUrl: buildAbandonedCartRecoveryUrl(snapshot.cart_id, trackingToken),
    segment: snapshot.segment,
    freeShippingQualified: snapshot.free_shipping_qualified,
    freeShippingRemaining: snapshot.free_shipping_remaining,
  };
  const template =
    sequenceNumber === 1 ? (
      <AbandonedCartTemplate {...props} />
    ) : sequenceNumber === 2 ? (
      <AbandonedCartPersonalTemplate {...props} />
    ) : (
      <AbandonedCartUrgencyTemplate {...props} />
    );

  return pretty(await render(template));
}
