# MUSE storefront performance — 3 September 2026

Local implementation; no commit, push, deployment, or catalogue mutation.

## Measured result

An uncached comparison executed the before/after `listProductsWithSort` implementations against the configured production Store API, using the same NZ region, default shuffled order, candidate fields, and 12 displayed products. It excluded region lookup time, Next.js caches, rendering, images, hydration, and cart mutations. One sequential before/after sample was taken; these are backend data-loading measurements, not production page-load or Core Web Vitals scores.

| Measurement | Before | After |
| --- | ---: | ---: |
| Elapsed backend work | 9,263 ms | 2,035 ms |
| Total response JSON | 4,349,394 bytes | 367,357 bytes |
| Detailed products requested | 201 | 12 |
| API requests | 3 | 9 |
| Products displayed | 12 | 12 |

Elapsed work decreased 78%; JSON decreased 92%. More small identity requests replace the large variant/pricing downloads; the independent identity pages run concurrently and retain 60-second time-based caching. The old two large responses exceeded Next.js's 2 MB per-entry cache limit. Raw measurements: `2026-09-03-benchmark.json`.

A discarded first attempt kept region_id on identity queries and was slower. Live API comparison showed that region_id expanded those requests into variant pricing payloads. The final implementation omits regional pricing context only for explicitly identity/media-only fields. Displayed products continue to request regional pricing, stock, options, and metadata.

## Changes

- `apps/storefront/src/lib/data/products.ts`: fetch and shuffle the complete lightweight identity list, then fetch the displayed page's details. Preserve stable 15-minute rotation, exclude hidden products, retain thumbnail fallbacks, and eliminate image requests for handle-only queries. Identity/media queries also avoid unnecessary region lookup and pricing expansion. Sitemap identity queries include timestamps without variant payloads.
- The same data layer passes a single brand/tag filter directly to Medusa before pagination. ASICS now returns all 244 matches rather than filtering the first 100 detailed products locally.
- `apps/storefront/src/lib/data/regions.ts`: coalesce reads during a render and use a five-minute time-based cache instead of a never-expiring process Map and cookie-dependent tags.
- `apps/storefront/src/lib/data/cart-for-render.ts`: React request-scoped cart memoization shared by the main layout, drawer wrapper, and product recommendations. The underlying fetch remains no-store. Mutation and recovery code continues to use fresh retrieveCart reads; there is no shared persistent cart cache.
- `apps/storefront/src/modules/layout/templates/nav/index.tsx`: request category navigation fields without every category's product relationships.

Existing uncommitted design, campaign, catalogue, tracking, and checkout work was preserved. The production build tested a snapshot of the current working storefront, including that pre-existing work; it does not imply the entire worktree should be released.

## Verification

- Storefront TypeScript check passed.
- Regression check: `node scripts/test-storefront-performance.cjs`. Covers identity-only queries, regional pricing on displayed products, 12-product hydration, hidden products, deterministic shuffle, distinct pages, pagination beyond 200 products, last and out-of-range pages, direct brand filtering, and missing-thumbnail recovery.
- Production build ran with NODE_ENV=production in `/tmp/muse-speed-build`, with the current source snapshot and existing dependencies, to avoid disrupting the active development server at port 8000. Generated 132 static pages. Existing lint warnings remain.
- Local browser: default listing renders 12 products and 762 discoverable styles with prices and delivery labels; ASICS interaction shows immediate loading feedback and resolves to 244 styles with no captured browser errors.
- Local product page: Nike Shox TL - Black University Gold renders images and NZ$160 price; selecting M 8 / W 9.5 enables Add to bag. The existing browser cart was not changed.
- Local ASICS page 21 returned HTTP 200 and the remaining four products in 3.29 seconds, including development rendering. This is a smoke check, not a controlled latency comparison.

## Release and remaining work

Medusa's announcement says incremental caching is enabled by default, supports time-based revalidation, and is activated for older deployments by deploying again: https://medusajs.com/blog/faster-storefronts-deployment-rules-and-budget-alerts . The storefront already used 60-second product caching; reducing cache-entry size and unnecessary work is necessary alongside Cloud support.

The current live domain https://store.musenz.com failed TLS handshakes in both Chrome (ERR_SSL_VERSION_OR_CIPHER_MISMATCH) and Node/curl from this machine. No certificate validation was bypassed. DNS resolves its CNAME to proxy.medusajs.site. This blocks live timing and availability verification here; it does not establish the root cause or prove every customer's connection fails.

A scoped release and post-deployment cold/warm mobile checks remain. No live speed improvement is claimed. Cart mutation latency was not benchmarked. Combined size/price/stock/colour facets and price sorting still use the existing bounded detailed-candidate implementation and need a separate backend filtering change for complete catalogue correctness and consistently fast cold combinations. Their old limits were not removed by this pass. Product writes continue to validate price and availability with Medusa.
