import fs from "node:fs/promises";
import path from "node:path";

const BACKEND_URL = "https://appealing-quince-change.medusajs.app";
const ENV_PATH = path.resolve(".image-upload.env");
const REPORT_PATH =
  "/Users/mrburns_mac/Documents/Claude/Projects/MUSE/medusa-imports/veja-campo-leather-white-black-nz-stock-clearance-report.json";
const IMAGE_PATHS = Array.from(
  { length: 10 },
  (_, index) => `/Users/mrburns_mac/Downloads/IMG_${9161 + index}.jpeg`,
);

const IDS = {
  shippingProfile: "sp_01KRATS3PNX3RW4RVRZVRT8N3X",
  salesChannel: "sc_01KRATS3RAF685EQT0HTDJ8BAM",
  collection: "pcol_01KT3J4GQFD59R6D59GV922EXM",
  productType: "ptyp_01KT3XHVVFEHRPE0PQHYPMHCAN",
  category: "pcat_01KT3HFA42VKPWG91CVBR33XA8",
  aucklandLocation: "sloc_01KT3EQYS178JF4J2D69D3Q15E",
};

const TAG_VALUES = [
  "veja",
  "veja-campo",
  "colour:black",
  "colour:white",
  "colour:cream",
  "sale",
  "clearance",
];

// Official VEJA Campo chart, limited to the requested maximum EU 45.
const SIZE_ROWS = [
  ["35", "W4", "2", "21.5", "22"],
  ["36", "W5", "3", "22", "22.6"],
  ["37", "W6", "4", "23", "23.3"],
  ["37.5", "W6.5", "4.5", "23.5", "23.7"],
  ["38", "W7", "5", "24", "24"],
  ["38.5", "W7.5", "5.5", "24.5", "24.3"],
  ["39", "W8 / M6", "W6 / M5.5", "25", "24.6"],
  ["40", "W9 / M7", "W7 / M6", "25.5", "25.3"],
  ["41", "W10 / M8", "W8 / M7", "W26.5 / M26", "26"],
  ["42", "W11 / M9", "W8.5 / M8", "W27.5 / M27", "26.6"],
  ["42.5", "W11.5 / M9.5", "W9 / M8.5", "W28 / M27.5", "27"],
  ["43", "M10", "9", "28", "27.3"],
  ["43.5", "M10.5", "9.5", "28.2", "27.7"],
  ["44", "M11", "10", "28.5", "28"],
  ["45", "M11.5", "11", "29", "28.6"],
].map(([eu, us, uk, jp, footLengthCm]) => ({
  eu,
  us,
  uk,
  jp,
  footLengthCm,
}));

const TITLE = "Veja Campo Leather - White Black";
const HANDLE = "veja-campo-leather-white-black-cp0501537-nz-stock-clearance";
const EXTERNAL_ID = "NZSTOCK-CLEARANCE-VEJA-CAMPO-CP0501537-WHITE-BLACK";
const STYLE_CODE = "CP0501537";
const PRICE = 100;
const STOCK_EU_SIZE = "41";
const DESCRIPTION = `The Veja Campo Leather White Black pairs a clean white ChromeFree leather upper with the signature black V logo and black heel tab.

The low-profile Campo silhouette has a lace-up closure, textile lining, and a rubber outsole made with wild rubber sourced from the Amazon. This pair is made in Brazil.

Clearance condition note: the soles are off-white with a yellowish tone rather than pure white. Please review the supplied photos carefully before purchasing.

Only EU 41 is available. This pair is NZ Stock and final sale - no refunds or exchanges.`;

const envText = await fs.readFile(ENV_PATH, "utf8");
const apiKey = envText.match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1];
if (!apiKey?.startsWith("sk_")) {
  throw new Error(`Missing MEDUSA_ADMIN_API_KEY in ${ENV_PATH}`);
}

const authHeaders = { Authorization: `Basic ${apiKey}` };
const dryRun = process.argv.includes("--dry-run");

const adminFetch = async (url, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${url} failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`,
    );
  }
  return body;
};

const uploadFile = async (filePath) => {
  const data = await fs.readFile(filePath);
  const form = new FormData();
  form.append(
    "files",
    new File([data], path.basename(filePath), { type: "image/jpeg" }),
  );
  const response = await fetch(`${BACKEND_URL}/admin/uploads`, {
    method: "POST",
    headers: authHeaders,
    body: form,
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Upload failed ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`,
    );
  }
  return body.files[0];
};

const ensureTag = async (value) => {
  const body = await adminFetch("/admin/product-tags?limit=500");
  const existing = (body.product_tags || body.tags || []).find(
    (tag) => tag.value === value,
  );
  if (existing) return existing;
  if (dryRun) return { id: `dry-${value}`, value };

  const created = await adminFetch("/admin/product-tags", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value }),
  });
  return created.product_tag || created.tag;
};

const existingBody = await adminFetch(
  `/admin/products?limit=50&q=${STYLE_CODE}&fields=id,title,handle,external_id,metadata`,
);
const existing = (existingBody.products || []).find(
  (product) =>
    product.handle === HANDLE ||
    product.external_id === EXTERNAL_ID ||
    product.metadata?.product_code === STYLE_CODE,
);

if (existing) {
  console.log(`Skipped existing product: ${existing.id} ${existing.title}`);
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(
    REPORT_PATH,
    JSON.stringify({ skipped: true, existing }, null, 2),
  );
  process.exit(0);
}

for (const imagePath of IMAGE_PATHS) {
  await fs.access(imagePath);
}

const tags = [];
for (const value of TAG_VALUES) tags.push(await ensureTag(value));
const tagIds = tags.map((tag) => tag.id);

console.log(`Mode: ${dryRun ? "dry-run" : "import"}`);
console.log(
  `Would create ${TITLE} with ${SIZE_ROWS.length} EU sizes; only EU ${STOCK_EU_SIZE} has stock 1.`,
);

if (dryRun) {
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(
    REPORT_PATH,
    JSON.stringify(
      {
        dry_run: true,
        title: TITLE,
        handle: HANDLE,
        style_code: STYLE_CODE,
        price_nzd: PRICE,
        size_rows: SIZE_ROWS,
        stock_eu_size: STOCK_EU_SIZE,
        image_paths: IMAGE_PATHS,
        tag_ids: tagIds,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const files = [];
for (const filePath of IMAGE_PATHS) {
  files.push({ local_path: filePath, ...(await uploadFile(filePath)) });
}
const imageUrls = files.map((file) => file.url);

const payload = {
  title: TITLE,
  subtitle: "Clearance - NZ Stock - EU 41 - Final Sale",
  handle: HANDLE,
  description: DESCRIPTION,
  status: "published",
  discountable: false,
  weight: 400,
  external_id: EXTERNAL_ID,
  thumbnail: imageUrls[0],
  images: imageUrls.map((url) => ({ url })),
  options: [{ title: "Size", values: SIZE_ROWS.map((row) => row.eu) }],
  variants: SIZE_ROWS.map((row) => ({
    title: row.eu,
    sku: `MUSE-VEJA-CAMPO-${STYLE_CODE}-${row.eu}`
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase(),
    allow_backorder: false,
    manage_inventory: true,
    weight: 400,
    options: { Size: row.eu },
    prices: ["nzd", "usd", "eur"].map((currency_code) => ({
      currency_code,
      amount: PRICE,
    })),
    metadata: {
      brand: "VEJA",
      model: "Campo Leather",
      eu_size: row.eu,
      us_size: row.us,
      uk_size: row.uk,
      jp_size: row.jp,
      foot_length_cm: row.footLengthCm,
      display_size: row.eu,
      size_system: "veja-campo-eu",
      nz_stock_quantity: row.eu === STOCK_EU_SIZE ? "1" : "0",
      availability_note:
        row.eu === STOCK_EU_SIZE
          ? "NZ stock - clearance, single pair"
          : "Out of stock",
    },
  })),
  shipping_profile_id: IDS.shippingProfile,
  collection_id: IDS.collection,
  categories: [{ id: IDS.category }],
  type_id: IDS.productType,
  tags: tagIds.map((id) => ({ id })),
  sales_channels: [{ id: IDS.salesChannel }],
  metadata: {
    source: "local_nz_stock",
    stock_source: "nz_stock",
    brand: "VEJA",
    model: "Campo Leather",
    product_code: STYLE_CODE,
    style_code: STYLE_CODE,
    colourway: "White/Black",
    full_colourway: "White / Black / Off-white sole",
    colour_tags: "colour:white | colour:black | colour:cream",
    colour_confidence: "verified",
    colour_source: "StockX, VEJA, and customer-supplied photos",
    stockx_url: "https://stockx.com/veja-campo-low-chromefree-white-black",
    veja_url:
      "https://www.veja-store.com/en_us/p/campo-leather-white-black-CP0501537.html",
    size_chart: "veja-campo-eu",
    size_chart_source: "https://www.veja-store.com/en_gl/sizeguide",
    size_display_note: "Sizes are shown in EU.",
    source_size_system: "eu",
    display_size_system: "eu",
    physical_size_label: "EU 41 / US 10 / UK 8 / JP 27 / BR 39",
    fit_sized_down: "0%",
    fit_true_to_size: "92%",
    fit_sized_up: "8%",
    image_source: "customer-supplied photos",
    condition_note:
      "The soles are off-white with a yellowish tone rather than pure white.",
    is_clearance: "true",
    return_policy: "final_sale_no_refunds",
    clearance_price_nzd: String(PRICE),
    seo_title: "Veja Campo Leather White Black | Clearance NZ Stock | MUSE",
    meta_description:
      "Clearance Veja Campo Leather White Black in EU 41. NZ Stock, $100 final sale. Off-white/yellowish soles shown in the product photos.",
  },
};

const created = await adminFetch(
  "/admin/products?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*variants.options,*variants.prices,*tags,*categories,*collection,*type,metadata",
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  },
);

const product = created.product;
for (const variant of product.variants || []) {
  const row = SIZE_ROWS.find(({ eu }) => eu === variant.title);
  const itemId =
    variant.inventory_items?.[0]?.inventory_item_id ||
    variant.inventory_items?.[0]?.id;
  if (!row || !itemId) {
    throw new Error(
      `${product.id}/${variant.id}: missing size row or inventory item`,
    );
  }
  await adminFetch(`/admin/inventory-items/${itemId}/location-levels`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      location_id: IDS.aucklandLocation,
      stocked_quantity: row.eu === STOCK_EU_SIZE ? 1 : 0,
    }),
  });
}

const { product: verified } = await adminFetch(
  `/admin/products/${product.id}?fields=id,title,handle,external_id,status,thumbnail,*images,*variants,*variants.inventory_items,*variants.options,*variants.prices,*tags,*categories,*collection,*type,metadata`,
);
const stockedVariant = verified.variants.find(
  (variant) => variant.metadata?.eu_size === STOCK_EU_SIZE,
);

if (
  verified.status !== "published" ||
  verified.images.length !== IMAGE_PATHS.length ||
  verified.variants.length !== SIZE_ROWS.length ||
  stockedVariant?.title !== STOCK_EU_SIZE
) {
  throw new Error("Admin read-back assertion failed");
}

const report = {
  created_at: new Date().toISOString(),
  product_id: verified.id,
  title: verified.title,
  handle: verified.handle,
  status: verified.status,
  image_count: verified.images.length,
  variant_count: verified.variants.length,
  stocked_variant: {
    id: stockedVariant.id,
    title: stockedVariant.title,
    metadata: stockedVariant.metadata,
  },
  collection: verified.collection,
  type: verified.type,
  categories: verified.categories,
  tags: verified.tags.map((tag) => tag.value),
  metadata: verified.metadata,
  files,
};

await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(`Created ${verified.id}: ${verified.title} [${verified.status}]`);
console.log(
  `Images: ${verified.images.length}; variants: ${verified.variants.length}; stocked: EU ${stockedVariant.title}`,
);
console.log(`Report: ${REPORT_PATH}`);
