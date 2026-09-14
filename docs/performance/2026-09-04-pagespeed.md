# Mobile PageSpeed fixes — 4 September 2026

Release: `9aff5484f668b8b91d9ec3cc15e4a82551d80bf8`.

## Evidence and scope

The supplied reports cover the homepage, footwear and outerwear. Their origin-level field data shares the same 28-day window; it is not three independent page measurements. Reported mobile lab LCP: 8.6 s, 8.1 s and 5.0 s respectively.

Common findings: images without browser cache TTLs, oversized campaign/brand assets, missing high fetch priority on the LCP image, hidden secondary product images downloading, analytics main-thread work, and duplicated mobile filter DOM.

## Changes

- Existing campaign artwork encoded at 384/640/828/1200 widths, AVIF with WebP fallback. Static imports generate content-hashed asset URLs and avoid runtime image transforms. Source artwork and layout preserved.
- Header/footer logo, social icons and payment badges use resized hashed assets. All eight badge files total 24,748 bytes; report transfer sizes total approximately 140 KB. Explicit intrinsic dimensions preserve aspect ratios; badge CSS keeps width automatic.
- Hero, first listing products and product detail image have high fetch priority. Listing sizes reflect the grid instead of downloading desktop-size thumbnails on mobile.
- Hover photos mount only after a mouse pointer enters. The primary image stays visible until its replacement loads. Touch browsing avoids these extra downloads.
- Google library and Meta load after the load event. Google setup remains early; Meta queues early events and flushes once ready. Purchase deduplication IDs preserved.
- Closed mobile filter panel does not mount its duplicate filter contents and is inert. Opening/closing verified in Chrome at a 390 px viewport.
- Category metadata falls back when a description is blank; breadcrumb contrast and mobile filter heading improved.

## Validation

- Production build completed (132 static pages), with existing lint warnings.
- Storefront typecheck and catalogue performance regression script passed.
- Early analytics events retain order, flush once, and preserve purchase event IDs.
- Desktop homepage artwork and mobile filter panel inspected in Chrome.
- Pre-release live footwear Lighthouse 12.8.2: performance 60, LCP 7.77 s, TBT 237 ms, transfer 1,168,635 bytes. This is a separate local-run mobile audit, not the user's PageSpeed snapshot.
- Local production-build footwear audit: performance 85, LCP 3.78 s, TBT 227 ms, transfer 962,293 bytes, accessibility 100. Localhost timing is not comparable with production timing and is not a claimed live improvement.

## Remaining hosting limitation

Live `/_next/image` responses have no Cache-Control header despite the existing Next configuration. Medusa's current documentation explicitly says Next.js image optimisation is not supported as expected on Cloud: https://docs.medusajs.com/cloud/storefront#nextjs-image-optimization . This release bypasses that path for fixed campaign/brand assets. Dynamic catalogue images still use it; an external image service or a platform fix is needed for reliable browser caching there. Do not claim this is solved by adding the same Next cache headers again.

Next 15 streams dynamic category descriptions into the document body for regular browsers. The corrected description is present in rendered HTML, but Lighthouse 12's metadata audit still reports it missing. Do not disable streaming globally merely to change an audit score.

The 28-day field metrics will not reset on deployment. Advanced combined-filter backend latency remains a separate known constraint from the earlier performance pass.

## Production release verification

Both backend and storefront reached `deployed` for build `build_01M1MKFC5G0C791R2CJJB1PHFT`. GitHub CI run `33809240603` succeeded. Homepage, footwear and outerwear returned HTTP 200. New image URLs and high priority hero markup are present in live HTML. Hashed logo and campaign AVIF/WebP files return HTTP 200 with `Cache-Control: public,max-age=31536000,immutable`.

Same Lighthouse 12.8.2 mobile setup, tested sequentially from this machine:

| Route | Before score | After score | Before LCP | After LCP | Before TBT | After TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | 73 | 90 | 7.45 s | 3.17 s | 168 ms | 191 ms |
| Footwear | 60 | 69 / 87 | 7.77 s | 3.54 / 3.29 s | 237 ms | 670 / 238 ms |

Footwear was repeated because the first run's blocking time was anomalously high. Both runs are retained; no consistent button-responsiveness improvement is claimed. Payload fell from 1.57 MB to 1.27 MB on home and from 1.17 MB to 1.00–1.02 MB on footwear. These are short lab measurements, not a statistical study or a replacement for field INP.

After deployment, a live product image still returned no Cache-Control header. The hosting limitation above remains confirmed, not hypothetical. Summary data is in `2026-09-04-pagespeed-results.json`.
