# Datheon Full Stack Projects

A collection of four independent web development projects by Aeron Lucero. These projects demonstrate Vue component architecture, browser state management, asynchronous API integration, accessible interactions, and automated testing through a developer portfolio and three interactive applications.

## About This Repository

All four projects use Vue 3, JavaScript, Vite, and Tailwind CSS. Momentum and NEXORA use Pinia; Atmos Weather uses composables for its weather and preference controllers. Each project owns its dependencies, lockfile, source code, documentation, and Vercel configuration. There is no root application or shared package workspace.

The applications are browser clients without a backend or authentication system. Atmos Weather and NEXORA make real requests to their documented public API providers; production failures never substitute test fixtures for live data.

## Projects Overview

| Project | Description | Technology stack | Main features | Folder location |
| --- | --- | --- | --- | --- |
| Developer Portfolio | Professional background, skills, and project showcase | Vue 3, Vite, Tailwind CSS 4, Lucide Vue Next, npm | Project dialogs, CV download, contact email draft, persistent themes, configurable metadata | [developer-portfolio](./developer-portfolio/) |
| Momentum | Browser-local productivity dashboard | Vue 3, Pinia, Vite, Tailwind CSS 4, `@lucide/vue`, npm | Task CRUD, combined filters, due dates, reordering, statistics, JSON backups | [DynamicTaskManager](./DynamicTaskManager/) |
| Atmos Weather | Live weather-model estimates and five-day forecasts | Vue 3, Vite, Tailwind CSS 4, `@lucide/vue`, Fetch, Yarn | Global city search, city-local time, °C/°F, weather backgrounds, saved preferences | [Real-Time-WeatherForecast&ClimateTelemetryApp](./Real-Time-WeatherForecast&ClimateTelemetryApp/) |
| NEXORA | E-commerce demonstration using FakeStoreAPI | Vue 3, Pinia, Vite, Tailwind CSS 4, `@lucide/vue`, Fetch, Yarn | Search/categories/sorting, product dialogs, persistent cart, integer-cent totals, simulated checkout | [ShoppingCart](./ShoppingCart/) |

## Project 1 — Developer Portfolio

A responsive portfolio presenting professional information, education, technical skills, project materials, and a downloadable CV. Its midnight-purple theme has a matching light theme. Content is maintained in `src/data/`, with reusable section and dialog components.

**Technology stack:** Vue 3 Composition API with `<script setup>`, JavaScript, Vite, Tailwind CSS 4, `lucide-vue-next`, and npm.

**Key features:**

- Scroll-aware navigation, mobile menu, project category filters, and accessible project detail dialogs.
- Persistent themes, reduced-motion support, responsive layouts, and local project images.
- Original CV download and internship certificate at their existing public paths.
- Validated contact form that prepares a `mailto:` draft. The visitor sends it through their email app; no message-delivery service is configured.
- Build-time canonical, Open Graph, and Twitter metadata using approved `SITE_URL` and `SOCIAL_IMAGE_PATH` inputs.

From the repository root, install and start development:

```sh
cd developer-portfolio
npm ci
npm run dev
```

From that project directory, test, build, and preview:

```sh
npm run test:metadata
npm run build
npm run preview
```

Local builds without approved metadata inputs remain usable but emit `noindex, nofollow`; Vercel production builds require both inputs. Follow the existing `.env.example` and [metadata contract](./developer-portfolio/README.md#build-time-canonical-and-social-metadata). No production domain is selected.

The student/graduate disagreement, missing project materials, legacy Lucide migration assessment, and PDF metadata recommendation remain documented without changing personal information or the original CV. See the [project README](./developer-portfolio/README.md).

## Project 2 — Momentum

A client-side task manager with a Pinia store and separate storage, validation, and calendar-date utilities. New browser profiles start with an empty workspace; statistics derive from actual task data.

**Technology stack:** Vue 3 Composition API, JavaScript, Pinia, Vite, Tailwind CSS 4, `@lucide/vue`, and npm.

**Key features:**

- Create, edit, complete, reopen, and delete tasks with accessible dialogs.
- Work, Personal, and Study categories; priorities; optional due dates; combined search/status/category/priority/date filters.
- Desktop drag-and-drop and keyboard move controls that preserve hidden tasks' positions during filtered reordering.
- Task counts, overdue detection, completion progress, and persistent light/dark themes.
- Validated versioned LocalStorage, corrupt-data protection, quota-failure notices, conflict detection, retry, and downloadable JSON backups.

From the repository root, install and start development:

```sh
cd DynamicTaskManager
npm ci
npm run dev
```

From that project directory, test, build, and preview:

```sh
npm test
npm run build
npm run preview
```

Tasks stay in the browser under `productivity.tasks.v1`; themes use `productivity.theme.v1`. Backups are real downloads, but a guided import/merge interface is not implemented. No application environment variables or backend are required. See the [project README](./DynamicTaskManager/README.md).

## Project 3 — Atmos Weather

A dashboard using Open-Meteo for geocoding and weather data. Current conditions are model estimates rather than verified local station observations. Five forecast entries include today. Components remain separate from cancelable requests, data normalization, and preference handling.

**Technology stack:** Vue 3 Composition API, JavaScript, Vite, Tailwind CSS 4, `@lucide/vue`, native Fetch, and Yarn 4.18.1.

**Key features:**

- Global Unicode city search with explicit selection among duplicate place names.
- Current temperature, feels-like temperature, humidity, wind speed, sea-level pressure, and daily minimum/maximum forecasts.
- City-local dates/time, Celsius/Fahrenheit conversion without refetching, and weather/day-night backgrounds.
- Loading, retry, rate-limit, timeout, invalid-data, and network-error states with stale-response protection.
- Saved city/unit/theme preferences, keyboard-accessible search, reduced-motion support, and provider attribution.

From the repository root, install and start development. Quote this path because it contains `&`:

```sh
cd 'Real-Time-WeatherForecast&ClimateTelemetryApp'
yarn install --immutable
yarn dev
```

From that project directory, test, build, and preview:

```sh
yarn test
yarn build
yarn preview
```

No API key or application environment variables are required for the configured qualifying noncommercial Open-Meteo service. Review usage/licensing restrictions before release; a commercial keyed configuration would require a server-side proxy and separate work. Preferences use `atmos.preferences.v1`; weather measurements are not persisted. See the [project README](./Real-Time-WeatherForecast&ClimateTelemetryApp/README.md).

## Project 4 — NEXORA

A storefront demonstration using real requests to FakeStoreAPI's sample product catalog. Pinia owns catalog filtering and cart state; prices normalize to integer USD cents. The application is not a retailer and processes no payments or real orders.

**Technology stack:** Vue 3 Composition API, JavaScript, Pinia, Vite, Tailwind CSS 4, `@lucide/vue`, native Fetch, and Yarn 4.18.1.

**Key features:**

- Product cards and accessible details with provider images, descriptions, categories, prices, and ratings.
- Combined title/description/category search, category navigation, and price/rating sorting without refetching.
- Persistent cart drawer, quantity controls, unavailable-product handling, JSON backup, and storage recovery safeguards.
- Decimal-safe demo totals: 8% estimated tax, $5.99 shipping, and free shipping for subtotals of $100 or more.
- Explicitly simulated local checkout, with no payment collection, backend order submission, or sensitive customer fields.
- System-aware persistent light/dark themes, responsive navigation, native dialogs, and reduced-motion support.

From the repository root, install and start development:

```sh
cd ShoppingCart
yarn install --immutable
yarn dev
```

From that project directory, test, build, and preview:

```sh
yarn test
yarn build
yarn preview
```

Cart storage under `nexora.cart.v1` contains product IDs and quantities; prices resolve against the current catalog. Tax/shipping assumptions are demonstration rules, not real quotations. No API key, backend, or application environment variables are required. See the [project README](./ShoppingCart/README.md).

## Getting Started

Use Node.js **26.x** to match the documented verification environment. Atmos Weather and NEXORA pin **Yarn 4.18.1** in `packageManager`. Enable Corepack if your Node distribution supplies it, or follow the Yarn setup instructions linked in those project READMEs. Preserve each project's existing package manager and lockfile.

Clone the actual repository and enter it:

```sh
git clone git@github.com:Aeronleelucero/fullstack.git datheonFullStack
cd datheonFullStack
```

The SSH clone command requires GitHub SSH access. Choose one project and use its commands above; each project block starts from the repository root. Return to that root before selecting another project. Run development servers in separate terminals; Vite prints the actual local URL and can select another port when one is occupied.

There is no root `package.json`: do not run a root dependency installation. Use `npm ci` for the portfolio and Momentum; use `yarn install --immutable` for Atmos Weather and NEXORA. If the standard npm registry is inaccessible, the [Momentum README](./DynamicTaskManager/README.md#run) documents a fallback through the public npm-compatible Yarn registry without changing package managers or lockfiles.

### Testing

Run the project-specific native Node tests listed above. No lint script is currently configured in any project. Retain meaningful regression tests and fixtures; test data is not imported by production source.

Atmos Weather and NEXORA also include Playwright/axe browser suites. Run these commands inside either Yarn project:

```sh
yarn playwright install chromium
yarn test:all
```

The browser suites build and manage their own production previews at ports 4175 and 4177 respectively. Regular browser cases mock API responses for deterministic testing only. A compatible existing Chromium can instead be selected through `ATMOS_CHROMIUM_PATH` or `NEXORA_CHROMIUM_PATH`. Separate real-network checks are opt-in:

```sh
# Inside Atmos Weather:
ATMOS_LIVE_TEST=1 yarn test:browser tests/live.spec.js

# Inside NEXORA:
NEXORA_LIVE_TEST=1 yarn test:browser tests/live.spec.js
```

These settings affect test tooling, not production configuration. Browser tests cover Chromium and configured axe rules; they do not certify physical devices, other browsers, or full accessibility conformance. Test results apply to the checkout and environment where the commands ran.

## Technology Stack

| Area | Technologies in this repository |
| --- | --- |
| UI and language | Vue 3, Composition API, `<script setup>`, JavaScript, semantic HTML |
| Styling | Tailwind CSS 4 via its Vite plugin, native CSS Grid/Flexbox, transitions and animations |
| State and persistence | Pinia in Momentum/NEXORA; Vue composables; validated versioned LocalStorage |
| Build tooling | Vite, Vue Vite plugin, npm lockfiles, Yarn 4 lockfiles and configuration |
| Icons | `@lucide/vue` in the applications; existing `lucide-vue-next` in the portfolio |
| APIs | Native Fetch with Open-Meteo and FakeStoreAPI |
| Verification | Node's built-in test runner, Vue SSR component tests, Playwright and axe |
| Deployment | Independent Vercel static projects, test/build gates, project-specific CSP and cache headers |

## Repository Structure

```text
datheonFullStack/
├── README.md
├── .gitignore
├── developer-portfolio/
│   ├── public/                  # CV, certificate, project images, favicon, theme script
│   ├── src/                     # components, composables, profile/project/skill data
│   ├── scripts/                 # build-time metadata validation
│   ├── tests/                   # metadata and Vite HTML regression tests
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── README.md
├── DynamicTaskManager/
│   ├── public/
│   ├── src/                     # components, Pinia store, composables, utilities
│   ├── tests/                   # task, storage, date, and ordering regressions
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── README.md
├── Real-Time-WeatherForecast&ClimateTelemetryApp/
│   ├── public/
│   ├── src/                     # components, composables, API services, utilities
│   ├── tests/                   # unit/SSR, browser, resize, and opt-in live tests
│   ├── package.json
│   ├── yarn.lock
│   ├── .yarnrc.yml
│   ├── index.html
│   ├── vite.config.js
│   ├── playwright.config.js
│   ├── vercel.json
│   └── README.md
└── ShoppingCart/
    ├── public/
    ├── src/                     # components, Pinia stores, API service, utilities
    ├── tests/                   # unit/SSR, browser, and opt-in live tests
    ├── package.json
    ├── yarn.lock
    ├── .yarnrc.yml
    ├── index.html
    ├── vite.config.js
    ├── playwright.config.js
    ├── vercel.json
    └── README.md
```

Dependency directories, build output, local environments, caches, coverage, and disposable browser reports are excluded from version control. Build output and caches can be regenerated with the documented commands. Required source, fixtures, lockfiles, assets, and deployment configuration remain in each project.

## Development and Deployment

Each application starts from its own `index.html`, mounts Vue through `src/main.js`, and builds static files into `dist/`. No client-side router or SPA rewrite is configured. Production preview serves a local build; it does not deploy or apply Vercel's hosted response headers.

Create a separate Vercel project for each folder only after explicit deployment approval. Select the **Vite** framework preset and **Node.js 26.x**, with these existing settings:

| Root Directory | Install Command | Build Command | Output Directory |
| --- | --- | --- | --- |
| `developer-portfolio` | `npm ci` | `npm run test:metadata && npm run build` | `dist` |
| `DynamicTaskManager` | `npm ci` | `npm test && npm run build` | `dist` |
| `Real-Time-WeatherForecast&ClimateTelemetryApp` | `yarn install --immutable` | `yarn test && yarn build` | `dist` |
| `ShoppingCart` | `yarn install --immutable` | `yarn test && yarn build` | `dist` |

Each `vercel.json` defines install/build/output settings and security/cache headers. For the Yarn projects, existing deployment instructions specify the build-platform setting `ENABLE_EXPERIMENTAL_COREPACK=1` to honor the pinned Yarn version. It is not an application credential.

Only the portfolio needs approved production `SITE_URL` and `SOCIAL_IMAGE_PATH` inputs, with Vercel system-variable exposure enabled for production/preview indexing checks. The other applications need no application environment variables. Keep real local environment files ignored; public Vite variables must never contain secrets.

Before release, run retained tests and the production build, review documented limitations and API usage terms, and obtain deployment approval. After an approved deployment, verify the actual HTTPS origin, assets, provider requests, security/cache headers, keyboard/mobile behavior, downloads, and persistence. No public deployment URLs are assumed here.

## Author

Aeron Lucero

## License

No repository-level or project-level application license file is present. This repository does not currently grant an explicit open-source license; obtain the author's permission for reuse. Dependencies, API services, and third-party data/assets remain subject to their own licenses and terms, including Open-Meteo's attribution and commercial-use requirements documented by Atmos Weather.
