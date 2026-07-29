// Picking "which photo matches the variant/color a customer picked" turned
// out not to be solvable from a single line item in isolation. Real MUSE
// catalogue data (checked directly via the store API on the North Face
// Nuptse Jacket, 13 colors x 7 sizes = 91 variants) shows every variant
// tagged with the same 10 generic detail/texture shots (fabric close-ups,
// zipper, logo — identical across every color) PLUS exactly one photo that's
// actually exclusive to that color. That exclusive photo lands at a
// different rank per color (rank 0 for Black, rank 11 for Navy, rank 22 for
// Cream & White, ...), so "take the lowest-ranked tagged image" — the first,
// simpler version of this fix — just picked whichever generic shot happens
// to sort first, which is why a fabric close-up was showing up for colors
// other than Black.
//
// There is no way to tell "generic" from "color-specific" by looking at one
// variant's own image list. The signal is comparative: an image shared by
// every sibling variant of the product (regardless of color) is generic: an
// image that only appears on the handful of variants belonging to one color
// is that color's real photo. So resolveLineItemImages fetches, once per
// distinct product in the order/cart, every sibling variant's tagged image
// ids, counts how many variants reference each image, and for each line item
// picks its own tagged image with the LOWEST sibling count (ties broken by
// rank). A product with only one variant (no real color/style choice) has no
// siblings to compare against, so every candidate ties at count 1 and the
// lowest-ranked (i.e. the product's main/hero) photo wins — which is exactly
// "just use the thumbnail image" for that case.
//
// variant.thumbnail — Medusa's own dedicated single-image field for a
// variant — is checked first when a merchant has explicitly set it, since
// that's an unambiguous, zero-guesswork signal that costs nothing to trust.
type ImageRef = {
  id?: string | null;
  url?: string | null;
  rank?: number | null;
};

type LineItemImageInput = {
  id: string;
  thumbnail?: string | null;
  variant?: {
    id?: string | null;
    thumbnail?: string | null;
    images?: ImageRef[] | null;
    product?: {
      id?: string | null;
      thumbnail?: string | null;
      images?: ImageRef[] | null;
    } | null;
  } | null;
};

type QueryGraph = {
  graph: (args: {
    entity: string;
    fields: string[];
    filters: Record<string, unknown>;
  }) => Promise<{ data: unknown[] }>;
};

async function fetchSiblingImageCounts(
  productIds: Set<string>,
  query: QueryGraph,
): Promise<Map<string, Map<string, number>>> {
  const countsByProduct = new Map<string, Map<string, number>>();

  await Promise.all(
    Array.from(productIds).map(async (productId) => {
      const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["id", "images.id"],
        filters: { product_id: productId },
      });

      const counts = new Map<string, number>();
      for (const variant of variants as { images?: { id?: string | null }[] | null }[]) {
        for (const image of variant.images ?? []) {
          if (image.id) {
            counts.set(image.id, (counts.get(image.id) ?? 0) + 1);
          }
        }
      }
      countsByProduct.set(productId, counts);
    }),
  );

  return countsByProduct;
}

function pickImage(
  item: LineItemImageInput,
  siblingCounts: Map<string, number> | undefined,
): string | null | undefined {
  if (item.variant?.thumbnail) {
    return item.variant.thumbnail;
  }

  const variantImageIds = new Set(
    (item.variant?.images ?? [])
      .map((image) => image.id)
      .filter((id): id is string => Boolean(id)),
  );
  const productImages = item.variant?.product?.images ?? [];
  const candidates = productImages.filter(
    (image) => image.id && variantImageIds.has(image.id),
  );

  if (candidates.length) {
    const ranked = [...candidates].sort((a, b) => {
      const countA = a.id ? siblingCounts?.get(a.id) ?? 1 : 1;
      const countB = b.id ? siblingCounts?.get(b.id) ?? 1 : 1;
      if (countA !== countB) {
        return countA - countB;
      }
      return (a.rank ?? 0) - (b.rank ?? 0);
    });
    if (ranked[0]?.url) {
      return ranked[0].url;
    }
  }

  return item.thumbnail ?? item.variant?.product?.thumbnail ?? null;
}

export async function resolveLineItemImages(
  items: LineItemImageInput[],
  query: QueryGraph,
): Promise<Record<string, string | null | undefined>> {
  const productIds = new Set(
    items
      .filter((item) => (item.variant?.images ?? []).length > 1)
      .map((item) => item.variant?.product?.id)
      .filter((id): id is string => Boolean(id)),
  );

  const siblingCountsByProduct = productIds.size
    ? await fetchSiblingImageCounts(productIds, query)
    : new Map<string, Map<string, number>>();

  const result: Record<string, string | null | undefined> = {};
  for (const item of items) {
    const productId = item.variant?.product?.id;
    const siblingCounts = productId ? siblingCountsByProduct.get(productId) : undefined;
    result[item.id] = pickImage(item, siblingCounts);
  }
  return result;
}
