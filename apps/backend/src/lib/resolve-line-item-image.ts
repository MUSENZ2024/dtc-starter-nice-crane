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
// was actually selected.
//
// `variant.images` (the ProductVariantProductImage pivot) comes back with no
// guaranteed order, so picking its first entry can surface any photo tagged
// to the variant — a macro/detail shot, not the canonical hero image. Ranking
// only lives on the image row itself (image.rank, the product's overall
// gallery order), so — exactly like the storefront does — filter the
// product's rank-ordered image list down to the ones tagged to this variant
// and take the lowest-ranked (first) one.
type ImageRef = {
  id?: string | null;
  url?: string | null;
  rank?: number | null;
};

type LineItemImageInput = {
  thumbnail?: string | null;
  variant?: {
    images?: ImageRef[] | null;
    product?: {
      thumbnail?: string | null;
      images?: ImageRef[] | null;
    } | null;
  } | null;
};

export function resolveLineItemImage(
  item: LineItemImageInput,
): string | null | undefined {
  const variantImageIds = new Set(
    (item.variant?.images ?? [])
      .map((image) => image.id)
      .filter((id): id is string => Boolean(id)),
  );
  const productImages = item.variant?.product?.images ?? [];

  if (variantImageIds.size && productImages.length) {
    const rankedVariantImages = productImages
      .filter((image) => image.id && variantImageIds.has(image.id))
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    if (rankedVariantImages[0]?.url) {
      return rankedVariantImages[0].url;
    }
  }

  return item.thumbnail ?? item.variant?.product?.thumbnail ?? null;
}
