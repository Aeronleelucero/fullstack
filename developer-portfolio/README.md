# Aeron Lucero — Developer Portfolio

A responsive Vue 3 portfolio with a midnight purple / neon lavender theme, a matching light theme, and real project content. Built with the Composition API, Vite, Tailwind CSS 4, and Lucide Vue Next. No backend, accounts, tracking, or secrets are required.

## Run locally

Use Node.js 26.x to match the verified release build, with npm and the existing lockfile. The installed Vite engine range also permits 22.12+.

```sh
cd developer-portfolio # omit if already in this directory
npm ci
npm run dev
```

Open the Local URL printed by Vite. To check the production bundle:

```sh
npm run test:metadata
npm run build
npm run preview
```

Build output is `dist/`. No lint script is configured in the original starter.

## Structure

```text
public/
  favicon.svg
  theme-init.js                 # persistent theme before first paint
  files/                        # original CV and completion certificate
  images/projects/              # real screenshots, reused as WebP
src/
  components/                   # navigation, page sections, cards, native dialog
  composables/useTheme.js
  data/profile.js               # identity, contact, education, CV location
  data/projects.js              # descriptions, images, stacks, links, contributions
  data/skills.js                # grouped technology inventory and interests
  App.vue                       # semantic page layout and reveal observer
  main.js
  style.css                     # theme tokens, responsive layouts, motion
scripts/metadata.js             # validated build-time canonical/social tags
tests/metadata.test.js           # Node tests, including Vite HTML integration
.env.example                    # blank public release metadata inputs
vercel.json                     # install/test/build commands and security headers
```

## Features

- Six navigation targets, scroll-aware active section, mobile menu, Escape-to-close, and skip link.
- Persistent light/dark preference with a usable fallback if browser storage is blocked. Dark is the default.
- CSS developer illustration, restrained hover/entrance/reveal effects, and reduced-motion support.
- Category filters and five project detail dialogs with native focus containment, Escape, close button, backdrop dismissal, and focus restoration.
- Actual project images with lazy loading and meaningful alternative text. Missing images are explicitly labeled.
- Real downloadable PDF, education timeline, and a locally sourced Datheon internship completion certificate.
- Contact validation with per-field accessible errors, focus on the first invalid field, preparing/ready states, and a real `mailto:` handoff.
- Semantic landmarks, responsive Grid/Flexbox layouts, descriptive metadata, local assets, and tree-shaken icons.

## Contact behavior

There is no message-delivery service. Submitting valid fields opens the visitor’s default email app with your real recipient, subject, message, and sender details. The visitor must send the email there. A ready state means the draft was prepared, not that anything was sent or delivered. A direct email link, draft retry link, and email-copy fallback are provided. A configured email app is required for `mailto:`.

The honeypot and a short cooldown reduce automated draft attempts; neither is server-side spam protection. If you later add a delivery endpoint, validate and rate-limit on the server, keep credentials server-side, implement proper abuse protection, and update the UI only after the service confirms delivery acceptance. Never put a private mail-service key in a `VITE_` variable.

## Content provenance and remaining details

Identity, contact links, Computer Science **student** wording, and contributions for Aqua, Operation Blackout, QR Attendance, and HERD-VISION follow the owner’s supplied information. Education dates are shown without claiming graduation.

- `public/files/Aeron-Lucero-CV.pdf` is copied byte-for-byte from the existing local `Portfolio/aeron-3d-cv/public/files/` directory. **That original PDF says “Computer Science graduate”; the owner’s latest supplied text says “student.”** The website follows the latest text. The discrepancy remains unresolved: confirm the intended status with the owner, then reconcile the website and/or PDF only after approval. Neither source ordering nor the education dates establishes which status is correct. The original PDF remains unchanged.
- Artikly’s description and screenshot come from the existing portfolio/CV. Aqua’s screenshot and original live URL are from that portfolio, with behavior corroborated by its local project README. Operation Blackout’s screenshot/live URL are from the existing portfolio and its stack is corroborated by the local checkout. Aqua and Operation Blackout repository URLs come from their actual Git remotes.
- Live URLs are original source values; continued availability of third-party deployments is not guaranteed. External links open in a new tab with `noopener noreferrer`.
- QR Attendance and HERD-VISION screenshots are not supplied and are visibly marked. Unknown repository and demo URLs stay `null`; the dialogs explain when links are unavailable.
- UnityCard and Training Events Management System were suggested names without verified content. They are omitted until descriptions, contributions, screenshots, and URLs are supplied. The QR Attendance project is not silently relabeled as another system.
- The Datheon Python Programming Internship entry is sourced from the existing completion certificate (four weeks, completed October 18, 2025). No job duties or employment beyond that evidence are claimed.
- The skills inventory includes technologies requested in the brief alongside owner-supplied skills; it does not assert proficiency percentages or experience duration. Review this inventory before job applications.

To maintain the site, edit the three files in `src/data/`, update section copy when needed, and replace public assets at their existing paths. Add only verified links. Configure canonical and social URLs through the build inputs below once the domain and image are approved. Do not hardcode a domain in `index.html`. Existing biography wording is unchanged.

## Verification

`npm run test:metadata` checks metadata validation and Vite's emitted HTML. Before release, use `npm run preview` to check navigation, project filters/dialogs, themes, keyboard access, contact drafts, and the CV download against the production bundle. No lint or permanent browser-test script is configured. The system-font stack avoids render-blocking font requests; no remote JavaScript or external font service is needed.

## Build-time canonical and social metadata

Copy `.env.example` to an ignored `.env.production.local` and supply real, approved values. The template deliberately contains no domain or image choice.

| Variable | Contract |
| --- | --- |
| `SITE_URL` | Absolute HTTPS origin, optionally ending in `/`. No credentials, non-root path, query, or fragment. Use the canonical production origin even for previews. |
| `SOCIAL_IMAGE_PATH` | Root-relative path to an approved PNG, JPEG, or WebP already inside `public/`. Missing files, unsupported extensions, traversal, and escaping symlinks are rejected. |

These public values are read by Vite at build time and need no `VITE_` prefix. Changing them requires a new build. No browser hostname or generated preview domain is used as a canonical fallback.

Configured builds emit a canonical link, `og:url`, and `twitter:url` from one normalized origin. The image gets absolute Open Graph/Twitter URLs, alt descriptions, and a `summary_large_image` card. Existing Open Graph title/type/description are preserved; Twitter title/description reuse that established copy. No social handle was invented.

Local builds without a URL remain functional, omit URL/image tags, and emit `noindex, nofollow`. An origin without an image uses a summary card locally and warns that an image is missing. These are review builds, not complete releases. Vercel production builds (`VERCEL_ENV=production`) fail if either input is absent; an explicitly configured but invalid URL/image also fails. Preview deployments remain noindex, including those supplied with the approved production canonical URL. The build checks URL format, image extension, and filesystem presence, not image decoding, artwork suitability, or domain ownership. Verify the supplied preview image itself before release.

The metadata tests use a reserved example domain and a copied real image only as temporary fixtures. Neither is a selected release value. Tests cover URL/asset safety, indexing, missing inputs, and Vite's emitted HTML. No dependency was added.

## Lucide replacement assessment

The supported successor is **`@lucide/vue`**. The [official migration guide](https://lucide.dev/guide/vue/migration) describes the rename and similar general icon API, but also removes brand icons. This site imports `Github` and `Linkedin`, so changing only the package/import path would break those imports.

Dependencies and lockfile remain unchanged. Before migration, verify every export and Vue peer requirement in an isolated candidate checkout, preserve the existing brand artwork through reviewed local SVG components, and rerun build, icon accessibility, interaction, and visual checks. A rename alone is not compatibility verification. No candidate package was installed or tested here.

## Safe PDF metadata recommendation

`pdfinfo` reports title `about:blank`, two pages, tagged content, and extractable text. Keep the CV and its download URL unchanged. After approval, create a separate metadata-only review copy with proposed title **Aeron Lucero — CV**, using a PDF metadata editor such as [ExifTool](https://raw.githubusercontent.com/exiftool/exiftool/master/html/TagNames/PDF.html). Do not print or regenerate the resume to correct a title.

Compare text, page count, tags, and page renders before approving the derivative; preserve the original checksum and obtain separate approval before changing the served file. This recommendation does not resolve student/graduate wording. No metadata-review derivative was created; the source CV and download link remain unchanged.

## Exact Vercel settings — deployment requires separate approval

| Setting | Value |
| --- | --- |
| Root Directory | `developer-portfolio` |
| Framework Preset | `Vite` |
| Node.js version | `26.x` (verified locally with 26.13.1) |
| Install Command | `npm ci` |
| Build Command | `npm run test:metadata && npm run build` |
| Output Directory | `dist` |
| Production variables | Approved `SITE_URL` and `SOCIAL_IMAGE_PATH` |
| Preview variables | Optional; if supplied, use the approved production origin; previews stay noindex |
| System variables | Keep automatic exposure enabled so `VERCEL_ENV` reaches the build |

[vercel.json](./vercel.json) contains the executable install/build/output and security/cache configuration. Root Directory, Node version, and environment scopes are project settings. See [Vercel's system-variable reference](https://vercel.com/docs/environment-variables/system-environment-variables) and [supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Existing headers provide content-type, referrer, permissions, and frame protection; CSP; and immutable caching for hashed build assets. Anchor navigation needs no SPA rewrites. These headers apply on Vercel, not the local preview server. Adding analytics, embeds, or a mail backend requires a deliberate CSP update.

## Final deployment checklist

- [ ] Owner reviews the unchanged student/graduate discrepancy, requested skills inventory, and missing project materials. Do not infer status from dates.
- [ ] Supply an approved HTTPS domain and social-preview image; configure both build inputs in the correct Vercel scope.
- [ ] Review existing Git changes together, including currently untracked source/public files. Nothing was staged, committed, or pushed here. Include the existing lockfile in later approved release source.
- [ ] With registry access, run `npm ci`, `npm run test:metadata`, and `npm run build`. Inspect the emitted HTML for approved canonical, Open Graph, and Twitter URLs.
- [ ] With accessible tooling/registry, run npm security and Lighthouse mobile/desktop audits against the production build; retain actual reports. Unavailable audits are not passes.
- [ ] Repeat navigation, keyboard, filters/dialogs, themes/reload, reduced motion, form/mailto/copy fallback, and CV download checks. Verify LinkedIn manually; automated requests return 999.
- [ ] Confirm the exact Vercel settings above, then obtain separate deployment approval. This checklist does not authorize committing, pushing, or deployment.
- [ ] After approved deployment, verify HTTPS, response headers/cache, assets, canonical/image URLs, social-card rendering, CV download, and email-app handoff on real devices. Production must be indexable; previews must remain noindex.
