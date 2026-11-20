# NEXORA — modern demo storefront

NEXORA is a Vue 3 e-commerce frontend built directly inside the existing `ShoppingCart/` folder. It uses the live FakeStoreAPI catalog, Pinia product/cart stores, integer-cent pricing, a persistent cart drawer, and an explicitly simulated checkout. It is not a retailer, payment processor, or inventory system.

## Yarn setup

Use **Yarn 4.18.1** and **Node 26.x**, matching `packageManager` and `engines.node`. If your Node distribution supplies Corepack, enable its Yarn shim before running the project; otherwise follow [Yarn's installation instructions](https://yarnpkg.com/getting-started/install). Use Yarn exclusively.

```sh
cd ShoppingCart
yarn install --immutable
yarn dev
```

Open Vite's Local URL. For production:

```sh
yarn test
yarn build
yarn preview
```

`.yarnrc.yml` uses the standard `node-modules` linker, the public Yarn registry, and an ignored checkout-local cache. The package-age gate remains enabled. Commit `yarn.lock` with source only after owner approval. No other package-manager lockfile is needed.

## Features and data

- Fetches `https://fakestoreapi.com/products` once with native Fetch and async/await. All product names, descriptions, prices, ratings, review counts, images, and category counts derive from that response.
- Cards, full product details, quantities, current-catalog pricing, category navigation, title/description/category search, and stable price/rating sorting. Filtering and sorting do not refetch the catalog.
- Provider category IDs stay exact: `electronics`, `jewelery`, `men's clothing`, `women's clothing`. UI spelling is **Jewelry**, and search supports both the provider identifier and the displayed label.
- Featured hero imagery is an editorial preview of records from the loaded catalog, not an assertion that those products are bestsellers or ranked by popularity. Default catalog order is the API's order; other sort labels describe their actual calculation.
- Skeletons, genuine empty catalog/no-match states, timeout/network/rate-limit/service/invalid-data errors, and real Retry behavior. No static production products or hidden fallback catalog is shipped.
- Invalid catalog records are excluded and their count is disclosed. An entirely invalid response is an error. Prices with unsupported decimal precision, invalid ratings, unknown categories, and duplicate IDs are rejected rather than invented or silently corrected.
- Product images remain on white photo backgrounds in both themes. Missing, failed, non-HTTPS, or untrusted-host images show a clearly labeled image-unavailable fallback. Only the FakeStoreAPI image hosts are allowed.
- Responsive sticky navigation, mobile menu, search, product modal, cart drawer, checkout, and local confirmation. Native dialogs provide modal semantics, focus containment, Escape/backdrop dismissal, scroll locking, and focus return. Reduced-motion settings are respected.
- Light/dark preference under `nexora.theme.v1`; initial system preference and later system changes are followed until an explicit preference is chosen. Theme switching still works for the session if preference writes fail.

FakeStoreAPI provides sample commerce data. “Live catalog” means a real request to this sample-data service, not verified retail stock or authentic customer reviews. NEXORA does not claim discounts, stock levels, sales rankings, real shipping guarantees, or verified purchases. No accounts, customer profiles, payment forms, checkout POSTs, analytics, or remote fonts are included.

API reference: [FakeStoreAPI](https://fakestoreapi.com/) and its [official source/documentation](https://github.com/keikaavousi/fake-store-api). Verify actual catalog and image requests separately from deterministic tests; provider availability can vary by network.

**No API key, application environment variable, backend, or `.env.example` is required.** Do not add secrets to public Vite variables. Product fetching and image loading require provider availability and internet access; production requests are never substituted with test fixtures.

## Cart contract

Pinia is the single source of truth. The cart's public actions are:

```js
cart.addToCart(product, quantity)
cart.removeFromCart(productId)
cart.updateQuantity(productId, quantity)
cart.calculateTotal() // grand total in integer USD cents
```

`nexora.cart.v1` stores **only** this JSON shape:

```json
[
  { "id": 1, "quantity": 2 }
]
```

IDs and quantities above are an example of the storage schema, not an authoritative product price or a seeded cart. New profiles start with an empty cart, and initialization does not automatically write to storage.

On reload, stored records are validated, the current catalog is fetched, and matching IDs resolve against current titles/prices. Stored prices, images, or other fields are never authoritative and are not serialized back. Adding an existing ID increases its quantity instead of creating another row. The cart badge counts total quantities, including explicitly shown unavailable saved items.

Quantity is a whole number from **1 to 99 per product**. This is a demo application limit, not a stock claim. Zero/negative/fractional quantities are rejected; decrementing at one is disabled. Only the explicit Remove action removes a line.

If a saved ID is absent from the current catalog, it is retained and shown as unavailable. It is excluded from monetary totals and blocks checkout until explicitly removed. Catalog failure does not delete saved IDs or display unverified old prices.

Storage behavior:

- Malformed/unsupported JSON, duplicate IDs, or invalid records preserve the original saved value and pause edits. Original-data download and a separately confirmed reset are provided.
- Initial read denial pauses edits to protect unknown existing data; browsing remains available. Reload can reacquire storage after access returns.
- Write/quota failures preserve the prior saved value and retain latest changes in memory. A visible warning offers real retry and JSON backup. Export before leaving if saving has failed.
- Saved-snapshot checks and native cross-tab storage events pause stale-tab edits rather than overwriting another tab. Reload is separately confirmed because it replaces the in-memory view.
- Reset changes only NEXORA's cart key, leaving theme and other applications' storage alone. No automatic reset or global LocalStorage clearing occurs.
- Cross-tab protection is best effort, not a transactional database. Simultaneous writes can still race. Browser clearing/eviction and origin changes can remove or isolate saved state.

Backup downloads contain IDs/quantities or the exact unreadable original. A guided backup-import/merge interface is not implemented. Do not replace storage containing work you have not saved elsewhere.

## Decimal-safe demo pricing

All prices normalize to **integer cents**. Line totals/subtotal remain integers. Tax uses integer basis points with half-up cent rounding; BigInt is used for the intermediate tax multiplication. The configurable assumptions are in `src/utils/pricing.js`:

| Demo rule | Value |
| --- | --- |
| Estimated tax | 8% of subtotal |
| Standard shipping | $5.99 |
| Free-shipping threshold | Subtotal of $100 or more, before tax |
| Empty-cart shipping/tax | $0 |
| Display currency | USD |

Grand total = subtotal + estimated tax + shipping. For example, three units at $19.99 yield $59.97 subtotal, $4.80 estimated tax, $5.99 shipping, and **$70.76 total**. This is a calculation example, not a claim about a live product's price.

The cart and checkout explicitly label these as demonstration assumptions, not jurisdiction-specific taxes or delivery quotes.

## Simulated checkout

Checkout shows current items and the full price breakdown. Confirmation generates a local `NX-…` demo reference, snapshots the current line items/totals in memory, and clears the cart **only if the local saved-cart clear succeeds**. If that write fails, the cart remains and no demo confirmation is shown. Duplicate confirmation of an empty cart is prevented.

No payment is taken, no goods are reserved, no order is submitted to FakeStoreAPI or a retailer, and no sensitive customer information is collected. The confirmation screen states all of this. The reference is session-only, is not a receipt, and is not a globally unique commercial order number.

## Tests and quality checks

```sh
yarn test
```

Runs **40 native Node tests**, including real Pinia store logic and a server-rendered Vue card. Covers API success/failure/timeout/validation, search/categories/sorts, merge/remove/quantities, persistence and corrupt-data protection, tax/shipping/totals, local checkout, cart clearing, and failure atomicity. The SSR harness disables HMR, websocket listening, and file watching.

Browser and accessibility tests:

```sh
yarn playwright install chromium
yarn test:browser
```

If a compatible Chrome installation already exists, set `NEXORA_CHROMIUM_PATH` to that executable. This is a test-only setting. The suite builds and manages its own production preview at port 4177. Regular tests mock APIs and image responses for deterministic checks; synthetic records live only under `tests/` and are never imported by production.

Run the separate live integration check explicitly:

```sh
NEXORA_LIVE_TEST=1 yarn test:browser tests/live.spec.js
```

It performs actual catalog/image requests under the configured CSP, exercises the cart and local checkout, checks that no non-GET checkout requests were sent, and captures temporary visual QA artifacts. It is skipped by default and must not be confused with mocked-response success.

```sh
yarn test:all
yarn npm audit --all --recursive
```

The audit command is Yarn's official registry-audit interface. No lint tool is configured. Deterministic tests establish behavior against controlled responses; the opt-in live test checks actual provider integration.

## Architecture

```text
src/components/          navigation, hero/categories, catalog, photos, ratings,
                         shared dialogs/quantity controls, cart/checkout/confirmation
src/stores/products.js   Pinia fetching, catalog, combined filters, stable sorting
src/stores/cart.js       Pinia cart, catalog resolution, pricing, persistence, demo checkout
src/services/productApi.js Fetch timeout/abort/errors and strict catalog normalization
src/utils/currency.js    price normalization and USD formatting
src/utils/pricing.js     integer-cent demo rules and totals
src/utils/storage.js     versioned cart storage and real backup downloads
src/utils/categories.js  exact provider IDs and friendly display labels
src/composables/useTheme.js persisted/system theme behavior
public/                 favicon, first-paint theme script, robots.txt
tests/                  unit/SSR tests, deterministic browser tests, opt-in live check
```

Runtime dependencies are Vue, Pinia, and supported `@lucide/vue`. Tailwind/Vite and Playwright/axe are build/test tools. No payment SDK, carousel library, dialog library, HTTP client, or money library is needed.

## Vercel deployment — approval required

Nothing is deployed or committed automatically. After explicit owner approval for source-control and deployment actions, use a dedicated Vercel project:

| Setting | Value |
| --- | --- |
| Root Directory | `ShoppingCart` |
| Framework | Vite |
| Node | 26.x |
| Yarn | 4.18.1, pinned by `packageManager` |
| Install Command | `yarn install --immutable` |
| Build Command | `yarn test && yarn build` |
| Output Directory | `dist` |
| Application/API variables | None |

Set the build-platform variable `ENABLE_EXPERIMENTAL_COREPACK=1` to honor the pinned Yarn version. It is not an application/API credential. Review [Vercel's Corepack guidance](https://vercel.com/docs/builds/configure-a-build#corepack).

`vercel.json` includes explicit catalog/image CSP hosts, same-origin scripts, content-type/referrer/frame/permissions protections, and immutable hashed-asset caching. Inline styles are allowed; no `unsafe-eval` or broad API wildcard is used. There are no URL routes requiring SPA rewrites.

After an approved deployment, verify real catalog/image availability, hosted security/cache headers, HTTPS, persisted cart reload, responsive navigation, modal keyboard behavior, and the simulated checkout disclaimer. Repeat on a real mobile device. Canonical URL, `og:url`, and a custom sharing image await a confirmed public URL/asset; no production domain is fabricated.

## Limits

- FakeStoreAPI and its images may be slow, unavailable, or restricted by network/provider controls. No offline catalog is cached, and no mock catalog is substituted.
- API descriptions/ratings are sample data, not verified merchandise claims. Unknown categories or unsupported precision are disclosed as invalid records.
- The cart is local to a browser/origin and device. Backups are useful if storage is restricted or before changing origins. No account synchronization, server-side cart, or import UI is provided.
- No real tax calculation, inventory reservation, shipping service, merchant support, payment processing, fulfilment, or real order history is implemented or implied.
- Modern browsers and localhost/HTTPS are required for native dialogs and `crypto.randomUUID()`.
- Chromium automation does not establish Safari/Firefox, physical-device, manual screen-reader, hosted-header, or full WCAG conformance.
