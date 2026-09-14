// Run from any directory: node scripts/test-storefront-performance.cjs
// Transpile the real data layer with the installed TypeScript; use a fake Store API.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const app = path.join(root, "apps/storefront");
const req = createRequire(path.join(app, "package.json"));
const ts = req("typescript");
const fields = fs
  .readFileSync(path.join(app, "src/lib/data/product-fields.ts"), "utf8")
  .match(/PRODUCT_CANDIDATE_FIELDS =\s*"([^"]+)"/)[1];
function loadProducts(filename, sdk, region) {
  const modules = new Map();
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const mod = { exports: {} };
    modules.set(file, mod);
    const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
    const localRequire = (id) => {
      if (id === "@lib/config") return { sdk };
      if (id === "./cookies") return { getAuthHeaders: async () => ({}) };
      if (id === "./regions")
        return {
          getRegion: async () => region,
          retrieveRegion: async () => region,
        };
      if (id.startsWith("@lib/") || id.startsWith(".")) {
        const target = id.startsWith("@lib/")
          ? path.join(app, "src/lib", id.slice(5))
          : path.join(path.dirname(file), id);
        return load(target + ".ts");
      }
      return req(id);
    };
    vm.runInThisContext(
      "(function(require,module,exports){" + compiled + "\n})",
      { filename: file }
    )(localRequire, mod, mod.exports);
    return mod.exports;
  }
  return load(filename);
}
const current = path.join(app, "src/lib/data/products.ts");
async function regression() {
  const fixtures = Array.from({ length: 235 }, (_, i) => ({
    id: "prod_" + String(i).padStart(4, "0"),
    title: i === 2 ? "Shipping protection" : "Product " + i,
    handle: i === 2 ? "shipping-protection" : "product-" + i,
    status: "published",
    thumbnail: i === 5 ? null : "https://example.com/" + i + ".jpg",
    variants: [
      {
        id: "variant_" + i,
        calculated_price: { calculated_amount: 99 },
        inventory_quantity: 4,
      },
    ],
  }));
  let calls = [];
  const sdk = {
    client: {
      fetch: async (url, opts) => {
        const q = opts.query;
        calls.push(q);
        if (q.fields === "id,title,handle,status")
          assert.equal(
            q.region_id,
            undefined,
            "identity indexes must omit regional pricing context"
          );
        if (q.fields.includes("variants"))
          assert.equal(
            q.region_id,
            "reg_test",
            "displayed products must retain region pricing"
          );
        let found = fixtures.filter((p) => !q.id || q.id.includes(p.id));
        const count = found.length;
        found = found.slice(q.offset || 0, (q.offset || 0) + (q.limit || 12));
        if (q.fields === "id,*images")
          return {
            products: found.map((p) => ({
              id: p.id,
              images: [{ id: "img", url: "https://example.com/fallback.jpg" }],
            })),
            count,
          };
        const names = q.fields.split(",");
        if (!q.fields.includes("variants"))
          found = found.map((p) =>
            Object.fromEntries(
              Object.entries(p).filter(([key]) => names.includes(key))
            )
          );
        return { products: found, count };
      },
    },
  };
  const api = loadProducts(current, sdk, { id: "reg_test" });
  await api.listProducts({
    countryCode: "nz",
    queryParams: { fields: "handle", limit: 100 },
  });
  assert.equal(calls.length, 1, "identity query must not request galleries");
  calls = [];
  const first = await api.listProductsWithSort({
    countryCode: "nz",
    sortBy: "random",
    page: 1,
    queryParams: { limit: 12, fields },
  });
  assert.equal(first.response.products.length, 12);
  assert.equal(first.response.count, 234);
  assert.equal(calls.filter((q) => q.fields.includes("variants")).length, 1);
  assert.equal(calls.find((q) => q.fields.includes("variants")).limit, 12);
  assert(
    first.response.products.every(
      (p) => p.variants?.[0]?.calculated_price.calculated_amount === 99
    )
  );
  const again = await api.listProductsWithSort({
    countryCode: "nz",
    sortBy: "random",
    page: 1,
    queryParams: { limit: 12, fields },
  });
  assert.deepEqual(
    first.response.products.map((p) => p.id),
    again.response.products.map((p) => p.id)
  );
  const second = await api.listProductsWithSort({
    countryCode: "nz",
    sortBy: "random",
    page: 2,
    queryParams: { limit: 12, fields },
  });
  assert(
    second.response.products.every(
      (p) => !first.response.products.some((a) => a.id === p.id)
    )
  );
  const last = await api.listProductsWithSort({
    countryCode: "nz",
    sortBy: "random",
    page: 20,
    queryParams: { limit: 12, fields },
  });
  assert.equal(last.response.products.length, 6);
  assert.equal(last.nextPage, null);
  calls = [];
  const outside = await api.listProductsWithSort({
    countryCode: "nz",
    sortBy: "random",
    page: 21,
    queryParams: { limit: 12, fields },
  });
  assert.equal(outside.response.products.length, 0);
  assert(!calls.some((q) => q.id));
  calls = [];
  const brand = await api.listProductsFiltered({
    countryCode: "nz",
    filters: { tag_id: ["tag_brand"], sortBy: "random", page: 20, limit: 12 },
  });
  assert.equal(brand.products.length, 6);
  assert.equal(brand.total, 234);
  assert(calls.every((q) => q.tag_id?.[0] === "tag_brand"));
  assert.equal(calls.filter((q) => q.fields.includes("variants")).length, 1);
  const fallback = await api.listProducts({
    countryCode: "nz",
    queryParams: { id: ["prod_0005"], fields: "id,title,handle,thumbnail" },
  });
  assert.equal(
    fallback.response.products[0].thumbnail,
    "https://example.com/fallback.jpg"
  );
  console.log(
    "PASS: identities avoid galleries; visible-page hydration; hidden products excluded; deterministic shuffle; distinct pages; page beyond 200; last/out-of-range pages; prices retained; thumbnail fallback"
  );
}
regression().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
