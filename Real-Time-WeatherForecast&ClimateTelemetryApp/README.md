# Atmos Weather

A live weather dashboard built directly in `Real-Time-WeatherForecast&ClimateTelemetryApp/`. Vue 3 Composition API, Vite, JavaScript, Tailwind CSS, supported `@lucide/vue` icons, and native Fetch. No backend or account is required for the configured Open-Meteo noncommercial API.

## Yarn setup

Use **Yarn 4.18.1** and **Node 26.x** to match the verified environment. `packageManager` pins Yarn; `engines.node` pins Node's major version. Yarn is already installed in the implementation environment. If your Node installation supplies Corepack, enable its Yarn shim with `corepack enable` before running the commands below. Otherwise install Yarn using the [official Yarn instructions](https://yarnpkg.com/getting-started/install). Use Yarn exclusively; no other package-manager lockfiles are needed.

From this existing project folder:

```sh
yarn install --immutable
yarn dev
```

Open Vite's printed Local URL. Production build and preview:

```sh
yarn test
yarn build
yarn preview
```

The project uses the standard `node-modules` linker. `.yarnrc.yml` uses the reachable public Yarn registry and a checkout-local ignored cache. Yarn's package-age protection remains enabled. Commit `yarn.lock` with the source when the owner authorizes source-control changes; do not commit `.yarn/`, `node_modules/`, or `dist/`.

## Weather provider and configuration

The app uses **Open-Meteo consistently for weather and geocoding**:

- `https://geocoding-api.open-meteo.com/v1/search` returns up to eight explicitly selectable matches. Country and administrative region distinguish places with the same name. Unicode names are URL encoded; the input supports international city names.
- `https://api.open-meteo.com/v1/forecast` requests exactly **five daily entries, including today**, current conditions, daily minimum/maximum temperatures, weather codes, sunrise, and sunset. Daily forecasts support more than five days under the documented endpoint limits.
- Current conditions include Celsius temperature, apparent temperature, relative humidity, wind at 10 metres in km/h, **sea-level atmospheric pressure in hPa**, weather code, and the provider's day/night flag. Weather descriptions and local SVG/Lucide symbols follow Open-Meteo's WMO code table.
- Open-Meteo's current conditions are **weather-model estimates**, based on 15-minute model data, rather than observations from a local weather station. The interface says so. “As of” shows the provider's validity timestamp; it is not a fabricated measurement time or the browser's fetch time.
- WeatherAPI was considered first. Its currently documented free plan supplies a three-day forecast and requires an account key; no qualifying paid account was supplied. Open-Meteo supplies all requested five days without introducing a secret or a proxy.

**No API key, application environment variable, or `.env.example` is required by this configuration.** No credential is stored in browser code or LocalStorage. Do not add a key to any `VITE_` variable: those values are public in Vite builds.

The free Open-Meteo endpoint is for **qualifying noncommercial use**, with fewer than **10,000 calls/day, 5,000/hour, and 600/minute** according to its terms checked on November 20, 2026. Commercial products, advertising, subscriptions, or promotional deployments may require a commercial licence. Verify the actual intended use before public release. Attribution to Open-Meteo and GeoNames is visible in the footer. No uptime or accuracy guarantee is implied.

For a commercial account requiring a key, the present frontend configuration is not sufficient: implement a server-side/serverless proxy with a server-only credential, restricted endpoints, validation, caching, and abuse controls before connecting that account. This project does not contain or pretend to configure that future proxy.

Sources: [Forecast API](https://open-meteo.com/en/docs), [Geocoding API](https://open-meteo.com/en/docs/geocoding-api), [Open-Meteo terms](https://open-meteo.com/en/terms), [WeatherAPI plans](https://www.weatherapi.com/pricing), [Lucide Vue package](https://lucide.dev/guide/vue/getting-started).

## Behavior

- **First visit:** Manila, Philippines is the identified default location, using coordinates verified through live geocoding. This is not an inferred user location. No geolocation permission is requested. No weather values are seeded or stored.
- **Return visit:** a validated saved city is restored and fresh weather is requested. Preferences contain only selected-city identity/coordinates/timezone, Celsius/Fahrenheit, and light/dark mode under `atmos.preferences.v1`.
- **Search:** 350 ms debounce, two-character minimum, eight matching results, loading/no-match/error feedback, keyboard arrows/Enter/Escape, and explicit city selection. Requests are cancelled and generation tokens prevent stale results from winning, including when a transport ignores cancellation.
- **Units:** data stays in Celsius; current, feels-like, high/low, and all forecast values convert locally to Fahrenheit without another API request. Wind and pressure retain their explicitly labeled metric units.
- **Dates:** current local time uses the selected location's IANA timezone. Unix API timestamps become instants; forecast calendar dates use the API's returned offset and are formatted independently of the browser timezone. Tests cover cross-midnight locations and a daylight-saving transition.
- **Backgrounds:** clear, cloudy/foggy, rainy, stormy, snowy, and night palettes. The provider's `is_day` chooses day/night, not the viewer's clock. All atmosphere animations respect reduced motion.
- **Refresh:** immediately on selection/reload, manually with Refresh, and every 15 minutes while visible. Returning to the tab refreshes if the last successful fetch is at least 15 minutes old. Failed requests do not create an automatic retry loop. A new fetch clears old measurements instead of presenting them under another city or as fresh data.
- **Errors:** network, timeout, rate limit, access/configuration, server failure, malformed JSON, or incomplete required forecast data produce honest states with real retry actions. Missing optional measurements show an em dash or “Unavailable”, never zero by substitution.
- **Storage safety:** malformed/unsupported preferences remain untouched and preferences apply only in memory for that session. Read/write restrictions show a notice and do not prevent using the app. External changes are not overwritten by a stale snapshot. No weather measurements, credentials, or analytics are persisted.

Search text, city coordinates, and the requesting IP are sent to Open-Meteo. API-request privacy is governed by the provider's terms. The app has no analytics, remote fonts, advertising, or authentication.

## Tests

```sh
yarn test
```

Runs 36 real unit/composable and Vue server-rendered component tests with Node's native test runner. Tests cover city search, invalid city responses, network/HTTP/timeout handling, loading, stale requests, five-day normalization/rendering, units, WMO codes, day/night, preference persistence/failures, timezone/date formatting, and DST. Synthetic API measurements live only in `tests/fixtures.js`; production source never imports them.

Browser tests are included with Playwright and axe:

```sh
yarn playwright install chromium
yarn test:browser
```

The browser suite starts and stops its own production preview at port 4175 and runs a production build first. Regular browser cases intercept weather APIs for deterministic testing and include all requested viewport widths, keyboard interaction, reduced motion, and WCAG 2/2.1 A/AA axe rules. The real-network test is skipped by default and is not included in a mocked-data success claim.

To opt into the real-network test:

```sh
ATMOS_LIVE_TEST=1 yarn test:browser tests/live.spec.js
```

If a compatible Chrome installation is already available, set `ATMOS_CHROMIUM_PATH` to its executable rather than installing another browser. No such machine-specific path is hardcoded in application code. These two `ATMOS_*` settings affect test tooling only; they are not production configuration.

Security check:

```sh
yarn npm audit --all --recursive
```

This is Yarn's official audit command, not a separate package manager. No lint tool is configured. Browser tests cover Chromium and configured axe rules, not physical-device or manual screen-reader certification. Live API availability must be checked separately from mocked-response tests.

## Structure

```text
public/                     favicon, first-paint theme script, robots.txt
src/components/             header/search, weather/details, forecast, background, states
src/composables/useWeather.js cancelable weather/search state, stale-response protection
src/composables/useTheme.js  matching persistent light/dark theme
src/services/weatherApi.js  Fetch, timeouts, HTTP errors, request parameters, normalization
src/services/defaultLocation.js verified initial Manila location; no weather measurements
src/utils/                  WMO codes, temperatures, dates, validated preferences
tests/                      native unit/SSR tests, Playwright cases, test-only API fixtures
vercel.json                 Yarn build gate, output and security/cache headers
yarn.lock                   reproducible dependency resolutions
```

Pinia is unnecessary here: the root owns one weather controller, one preference object, and a self-contained search controller. Presentation components receive explicit props/events; network and normalization logic remain separate.

## Deploy to Vercel — owner approval required

No commit, push, deployment, or publication is authorized by implementation alone.

| Setting | Value |
| --- | --- |
| Root Directory | `Real-Time-WeatherForecast&ClimateTelemetryApp` |
| Framework Preset | Vite |
| Node.js | 26.x |
| Package manager | Yarn 4.18.1, pinned by `packageManager` |
| Install Command | `yarn install --immutable` |
| Build Command | `yarn test && yarn build` |
| Output Directory | `dist` |
| Application environment variables | None |

Enable Vercel's Corepack support for the pinned Yarn version if it is not already enabled (`ENABLE_EXPERIMENTAL_COREPACK=1` is a build-platform setting, not a weather API secret or app variable). Do not accept an older global Yarn version in place of the pinned version. The folder contains `&`: quote its path in shell commands.

After separately approved source-control and deployment steps, use a fresh browser profile on the actual HTTPS origin to test both API hosts, five cards, Unicode search, °C/°F, theme persistence, reload, keyboard behavior, and mobile layout. Check the deployed response headers, CSP, and hashed-asset caching. `vercel.json` permits the two HTTPS Open-Meteo hosts through `connect-src`; no broad wildcard or API secrets are needed. There are no client-side routes requiring SPA rewrites.

No production domain is assumed. Basic Open Graph/Twitter text metadata is provided; canonical URL, `og:url`, and a custom sharing image await a confirmed public URL/asset rather than placeholder domains.

## Known limits

- Requires internet and provider availability; no offline forecasts or stored measurements. No fabricated fallback is shown.
- Provider modelling/resolution and geocoding coverage can differ from local station observations. Extremely small places may be absent, and the search returns at most eight candidates per query. Add a country/region or refine the spelling when needed.
- Forecaster timezone offsets for daily aggregation are fixed by the provider at request time. Local clock rendering is DST-aware; daily labels preserve the provider's forecast calendar dates.
- LocalStorage is per browser/origin. Blocked or corrupt preferences still allow session use, but cannot persist. There is no destructive automatic reset.
- No commercial licence, keyed commercial proxy, hosted configuration, physical-device verification, or manual screen-reader certification is implied. Measure Lighthouse mobile and desktop performance against the production build before release; earlier testing identified mobile performance as an optimization concern.
