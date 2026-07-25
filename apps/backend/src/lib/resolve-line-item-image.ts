// Mirrors getImagesForVariant() in the storefront PDP
// (apps/storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx) —
// that's the source of truth for "which photo matches the variant a customer
// picked". Cart/order line items don't carry that resolution themselves:
// Medusa's addToCartWorkflow stamps a single `thumbnail` string onto the line
// item at add-to-cart time (prepareLineItemData: item.thumbnail ??
// variant.thumbnail ?? variant.product.thumbnail), and `variant.thumbnail` is
// a separate opt-in field that's easy to leave unset even when a variant has
// its own image gallery — in which case that baked-in thumbnail silently
// falls back to the product's main image regardless of which variant/color
// was actually selected. Query the variant's own image gallery alongside the
// stored thumbnail and prefer it, so the abandoned-cart, order-confirmation,
// and shipping emails all show the color/variant the customer actually chose.
type LineItemImageInput = {
  thumbnail?: string | null;
  variant?: {
    images?: { url?: string | null }[] | null;
    product?: { thumbnail?: string | null } | null;
  } | null;
};

export function resolveLineItemImage(
  item: LineItemImageInput,
): string | null | undefined {
  const variantImage = item.variant?.images?.[0]?.url;
  if (variantImage) {
    return variantImage;
  }
  return item.thumbnail ?? item.variant?.product?.thumbnail ?? null;
}
