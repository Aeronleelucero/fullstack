# Momentum — Dynamic Task Manager

A complete, browser-local productivity application built in `DynamicTaskManager/`. Vue 3 Composition API, Vite, JavaScript, Tailwind CSS, Pinia, and the supported `@lucide/vue` package. No backend, authentication, account, API key, or application environment variable is required.

The first workspace starts empty; statistics derive from actual tasks, with no seeded examples.

## Run

Use Node.js 26.x to match the verified environment (26.13.1). The installed Vite engine range also supports Node 22.12+.

```sh
cd DynamicTaskManager
npm ci
npm run dev
```

Open the Local URL printed by Vite. For the production bundle:

```sh
npm test
npm run build
npm run preview
```

No lint tool is configured. `npm test` runs the real Pinia store and storage/date utilities with Node's built-in test runner; no test framework dependency is needed.

If the standard npm registry is inaccessible, the public npm-compatible Yarn registry can be used without changing package managers:

```sh
npm ci --registry=https://registry.yarnpkg.com --no-audit
```

The fallback does not change application behavior or require a runtime registry connection. The lockfile retains package integrity hashes. `--no-audit` skips a registry advisory request; it does not establish that packages are vulnerability-free. Use the normal registry and normal release audit when accessible.

## Features

- Create tasks with title, description, category, priority, optional due date, and completion status. Titles are required and trimmed; maximum lengths are 160 characters for titles and 4,000 for descriptions.
- Edit all user-facing fields in an accessible dialog. Drafts remain local to the form until saved; Cancel and Escape discard drafts. IDs, creation timestamps, and unknown saved record fields are preserved.
- Delete with an accessible confirmation that initially focuses Cancel. Focus returns to the task list after confirmed deletion, including during leave animations.
- Complete and reopen tasks immediately. Checkboxes, completed styling, screen-reader announcements, statistics, and storage update together.
- When editing or completing a task removes it from the current filter, focus moves to the stable task-list heading.
- Fixed default categories: Work, Personal, Study. Sidebar shortcuts and filter controls use the same centralized state. Custom-category creation is intentionally outside the core implementation.
- Combine All/Active/Completed, category, priority, and due-date filters with live title/description search. Clear filters returns to the All tasks workspace. Empty results include a useful recovery action.
- Native desktop drag-and-drop from a row's grip, plus accessible Move up/down buttons. Reordering a filtered list changes only its visible slots in the saved global sequence; hidden tasks keep their positions. Task IDs and data are preserved.
- Actual total, active, completed, overdue, due-today, upcoming, and rounded completion-percentage statistics. Dashboard statistics cover the entire loaded workspace, independently of list filters.
- Midnight-purple and matching light themes, persisted separately under `productivity.theme.v1`; session theme switching still works if preference storage is blocked.
- Mobile navigation with backdrop, Escape, focus containment, and focus restoration. Native task/confirmation dialogs support Tab/Shift+Tab, Escape, backdrop dismissal, and focus return.
- Reduced-motion support, responsive Grid/Flexbox, readable focus indicators, labeled fields, explicit text priority labels, and task-change announcements.
- Real JSON downloads for current tasks and unreadable original saved data. Exports include the complete loaded workspace, including tasks hidden by filters.

## Task and storage contract

`src/utils/storage.js` provides `loadFromLocalStorage()` and `saveToLocalStorage()`. The versioned key is **`productivity.tasks.v1`**. Its value is a JSON array of records:

```js
{
  id: crypto.randomUUID(),
  title: 'A task title',
  description: '',
  category: 'Work',
  priority: 'Medium',
  dueDate: '', // optional YYYY-MM-DD; empty string means no due date
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  order: 0
}
```

The application validates records, timestamps, allowed categories/priorities, calendar dates, order values, and duplicate identities. Loading data never writes to storage. Unknown record fields are retained rather than silently stripped.

- Empty storage gives an empty workspace without an automatic write.
- Malformed JSON, unsupported data, invalid records, or duplicate IDs pause editing and preserve the original saved value. Readable valid records can still be viewed. Download the original data before a separately confirmed reset.
- Reset replaces only this application's task key with `[]`; it does not clear other browser data or theme preferences. Cancel preserves everything.
- Read failures pause editing until access is restored and the user explicitly reloads saved data. Initial getter-denial recovery is supported without a page reload.
- Write/quota failures retain changes in memory, show an honest unsaved notice, and offer retry/export. An export is useful before leaving or reloading the page.
- Saved-snapshot comparisons and native `storage` events detect stale-tab updates. Conflicts pause editing rather than automatically replacing another tab's saved data. Export the current view before an explicitly confirmed reload.

LocalStorage is not transactional or a synchronization service. Cross-tab protection is best effort; nearly simultaneous writes cannot be promised atomic. Prefer one editing tab. Data belongs to this browser/origin and can be removed by browser settings or eviction. JSON exports provide a portable copy; an import/merge UI is not included. No external service receives task contents, and no task content is rendered as HTML.

`crypto.randomUUID()` requires a modern secure context: use localhost for development or HTTPS in production. Client-side input validation protects this application’s data model; there is no server to authenticate or validate.

## Dates and order

Due dates remain validated calendar strings and are never passed to `new Date('YYYY-MM-DD')` for comparison. The local calendar date comes from browser-local year/month/day values. Display formatting constructs a local date at noon. A partially typed native date must be completed or cleared before submission. Tests cover leap years, month boundaries, local midnight, and dates on opposite sides of UTC midnight.

Completed tasks never count as overdue. Date filters match calendar dates; Today/Upcoming sidebar shortcuts additionally select Active tasks. The local-date reference refreshes every minute and when tab visibility changes. Creation/update timestamps remain ISO instants and are separate from due-date calculations.

All sorting is manual; no date/priority sorting silently changes persisted order. Keyboard controls act relative to the currently visible tasks. Native HTML drag-and-drop is verified on desktop; use Move up/down buttons on touch devices.

## Structure

```text
public/                 favicon and first-paint theme script
src/components/         sidebar/header, stats, forms, list/cards, progress, dialogs
src/stores/tasks.js     Pinia CRUD, filters, ordering, statistics, recovery state
src/composables/        theme behavior
src/utils/storage.js    versioned storage, record checks, failure/conflict results
src/utils/taskSchema.js shared input/record validation and category/priority values
src/utils/dates.js      local-calendar date validation, display, and comparisons
src/utils/download.js   real Blob-backed JSON downloads
tests/run.js            automated Pinia/storage/date tests
vercel.json             static deployment, test/build gate, CSP/cache headers
```

## Deploy to Vercel — approval required

No deployment, commit, or push was performed.

| Setting | Value |
| --- | --- |
| Root Directory | `DynamicTaskManager` |
| Framework | Vite |
| Node.js | 26.x |
| Install | `npm ci` |
| Build | `npm test && npm run build` |
| Output | `dist` |
| Environment variables | None |
| Backend/authentication | None |

Select this application's Root Directory for its Vercel project. Assets are served from the deployment root. There are no client routes requiring SPA rewrites. Deploy only after separate owner approval.

`vercel.json` configures content-type protection, referrer/permissions policies, frame protection, CSP, and immutable caching for hashed build assets. Inline styles are allowed for Vue's numeric progress indicators; scripts remain same-origin. Forms never navigate to a server. Hosted headers still need verification after an approved deployment. A local browser check injected the policy and verified create/edit/complete/theme/export compatibility.

Before release, run a clean install, `npm test`, and `npm run build`; try task creation/edit/delete/reorder and reload, check the chosen domain on a real device, and verify the actual HTTPS/security/cache headers after approval. No permanent browser-test script is configured. Moving the app to another origin does not move the browser's existing LocalStorage data automatically.
