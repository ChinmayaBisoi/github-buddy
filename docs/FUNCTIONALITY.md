# GitHub Buddy: functionality and behavior

This document describes everything the extension does today, with exact clipboard output and examples. The content script is the source of truth (`src/content_script.tsx`, `src/utils.ts`).

**Maintainers:** Changes must follow project priorities and structure in [ENGINEERING.md](ENGINEERING.md) (security and resilience first, then SOLID and maintainability).

## Where it runs

### Manifest (`public/manifest.json`)

The content script is injected on:

- `https://github.com/*/issues*`
- `https://github.com/*/pulls*`
- `https://github.com/*/pull/*`

### Path gate (`src/utils.ts`)

Logic runs only when `isIssuesOrPullsPage(pathname)` is true. The pathname (no query string) must look like:

| Pattern | Example |
|--------|---------|
| Repo issues list | `/org/repo/issues` |
| Single issue | `/org/repo/issues/123` |
| Repo pulls list | `/org/repo/pulls` |
| Single pull request | `/org/repo/pull/456` |

Trailing slashes are normalized. Paths such as `/org/repo/issues/something-other-than-a-number` do not match, so list tools and row injection are skipped even though the URL may still load the content script.

## Features on the page

### 1. Per-row Copy

- **What:** A small green **Copy** control after the issue or PR title link in list views.
- **DOM:** Only rows whose title link `href` passes `isIssueOrPrUrl` (must end with `/issues/<id>` or `/pull/<id>`). List pages like `/issues` or `/pulls` without a numeric segment are excluded for each row.
- **Title text:** `link.textContent.trim()` from that anchor.
- **Implementation:** Vanilla `button` and `addEventListener("click", …)` so clipboard APIs keep a valid user gesture.
- **Tooltip / aria:** Title “Copy title as link”; `aria-label` “Copy issue/PR title as link”.

### 2. List toolbar: Copy Selected and Copy All

- **What:** Two green buttons in the list header area: **Copy Selected** and **Copy All (N)**.
- **Placement:** `injectListToolbar` uses `findTableHeader` on `#repo-content-pjax-container` (or `[data-pjax-container]`, or `body`). On the newer issues metadata bar (`id` ending with `-list-view-metadata`), the toolbar is appended there. Otherwise the classic header gets flex layout and the toolbar is inserted next to the Open/Closed (or “X selected”) cluster.
- **Copy Selected:** Reads every checked `input[type="checkbox"]`, walks to the row (`Box-row`, `issue-row`, `tr`, `li`), takes the first matching issue/PR link in that row, dedupes by absolute `href`.
- **Copy All:** Collects all visible issue/PR links on the page (same selector as row titles), dedupes by `href`, skips non-detail URLs and empty titles.
- **N in Copy All (N):** Length of that collected list. A `MutationObserver` on `#repo-content-pjax-container` or `.Box-body` refreshes the label when the list changes.
- **Implementation:** Entire toolbar is **vanilla DOM** with native click listeners (not React). This matches per-row Copy so `navigator.clipboard.write` with rich data is not dropped because of React’s async `onClick` and user-activation rules in Chrome.
- **Empty selection:** Shows toast “Nothing to copy”, inline red “Nothing to copy” beside the toolbar for ~2s.

### 3. Issue / PR detail page Copy

- **What:** Green **Copy** next to the issue or PR title (`h1` / `.gh-header-title` / `.js-issue-title` region).
- **When:** `isDetailPage(pathname)` and URL contains `/issues/` or `/pull/`.
- **Title string:** `buildDetailTitle(rawTitleText, currentUrl)`:
  - Trims whitespace.
  - If the title already contains `#`, it is left as-is.
  - Otherwise the numeric id from the URL (`/issues/42` or `/pull/42`) is appended as `#42` when present.
- **URL:** `window.location.href` (full URL including query/hash).
- **Implementation:** React `CopyButton` in a small root on the page (icons via Lucide). Same clipboard pipeline as list actions once the button runs.

## Clipboard behavior (exact)

Every copy action calls `copyIssueLinksRich(items)` with an array of `{ title, url }`.

### Step 1: Plain text (`text/plain`)

Built by `formatCopyPayloadMultiple`:

- One item: `formatCopyPayload(title, url)`.
- More than one: those strings joined with **two newlines** `\n\n`.

Per item (`formatCopyPayload`):

- If `title.trim()` is empty: plain text is **only the URL** (no markdown).
- Otherwise: a **Markdown inline link**: `[escapedTitle](url)`.
- Escaping in the title: `\`, `[`, and `]` are backslash-escaped for the label.

**Example (single):**

```text
[security(upload): fix project-scoped PDF / upload mutations (#3210)](https://github.com/EasySLR/next-easyslr/pull/3223)
```

**Example (two items):**

```text
[Fix bug #1](https://github.com/org/repo/issues/1)

[Fix bug #2](https://github.com/org/repo/issues/2)
```

### Step 2: Rich HTML (`text/html`)

Inner fragment from `formatCopyPayloadMultipleHtml`:

- Each item is `formatCopyPayloadHtml(title, url)`: `<a href="escapedUrl">escapedLabel</a>`.
- Label is trimmed title, or the URL if title is empty.
- `&`, `<`, `>`, `"` are escaped in both `href` and text (attribute-safe).

Multiple items are joined with `<br>` between anchors (no extra wrapper elements).

That fragment is embedded in a **minimal HTML document** for the clipboard:

```html
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><!--StartFragment-->…inner…<!--EndFragment--></body></html>
```

### Step 3: Writing to the clipboard

1. If `ClipboardItem` and `navigator.clipboard.write` exist, the extension writes **one** `ClipboardItem` with:
   - `text/plain`: UTF-8 blob produced from a **Promise** (Chrome-friendly).
   - `text/html`: UTF-8 blob of the full document above, also from a **Promise**.
2. If that `write` throws or is unavailable, it falls back to **`navigator.clipboard.writeText(plain)`** with the Markdown/plain string only (no HTML).

### What users see after paste

- **Rich targets** (Gmail, Google Docs, many editors, Notion, etc.): Usually a **clickable title** (or several, separated by line breaks from `<br>`), not a separate raw URL line under each title.
- **Plain-only targets** (some chats, terminals, plain `.txt`): They get the Markdown (or bare URL if title was empty). Linkification depends on the app.
- **Toast:** A short bottom-centered toast (“Copied!” or “Nothing to copy”) appears on the GitHub tab for ~1.5–2s. Toolbar actions also flash green/red status text next to the buttons briefly.

## PR list status badge styling

On list rows (`div.Box-row`, `[data-testid='issue-row']`, `tr`, `li`), text nodes that match PR review labels are recolored (no background chip):

| Matched text (trimmed) | Color | Font |
|------------------------|-------|------|
| Approved, • Approved | `#1a7f37` | 11px, weight 600 |
| Review required, • Review required | `#eab308` | same |
| Changes requested, • Changes requested, Requested Changes, • Requested Changes | `#cf222e` | same |

Nested elements that duplicate the same badge text are skipped so parent containers are not over-styled. Matched elements get `data-github-buddy-status`.

## Lifecycle and performance

- **List pages:** After load, `observeAndRun` attaches a `MutationObserver` on `document.body` with a **300ms debounce** and reruns list processing so PJAX navigation and DOM updates re-inject buttons and toolbar when needed.
- **Detail pages:** No body observer; `processDetailPage` runs once when the pathname is a detail path.
- **Deduping:** Copy controls use `data-github-buddy-copy` and per-URL data; toolbar uses `data-github-buddy-toolbar` so injection is idempotent.

## Permissions (`manifest.json`)

- **`storage`:** Used by the boilerplate options page (`src/options.tsx`); not used by the GitHub content script for copy behavior.
- **`clipboardWrite`:** Allows reliable use of async clipboard write from the extension context when needed.
- **`host_permissions` `https://github.com/*`:** Matches injected GitHub pages.

## Other extension surfaces (not GitHub copy features)

- **Popup (`src/popup.tsx`):** Starter demo (URL, clock, counter, sample `tabs.sendMessage`). Does not configure GitHub Buddy copy behavior.
- **Options (`src/options.tsx`):** Starter “favorite color” sync storage demo. Does not affect the content script.
- **Background (`src/background.ts`):** Empty 30s polling placeholder.

## Build and tests

- `npm run build` emits `dist/` (load unpacked from `dist/`).
- `npm test` runs Jest; `src/utils.ts` helpers (paths, copy string/HTML formatting, status matching) are covered in `src/__tests__/utils.test.ts`.
