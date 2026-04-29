# GitHub Buddy

Chrome extension that adds copy buttons and status badges to GitHub issues and pull requests. Copy puts a **clickable title** (HTML) plus a **Markdown link** fallback (`[title](url)`) on the clipboard so rich paste targets get one line per item instead of “title then raw URL”.

<img width="1710" height="941" alt="image" src="https://github.com/user-attachments/assets/b456e09b-3add-4296-824f-2e901103bae0" />

**Full reference (paths, clipboard strings, examples):** [docs/FUNCTIONALITY.md](docs/FUNCTIONALITY.md)

**How we build (security, robustness, resilience, SOLID):** [docs/ENGINEERING.md](docs/ENGINEERING.md)

## Features

### Copy actions

- **Per-row Copy button**: Green compact button next to each issue/PR title in list views
- **Issue/PR detail page**: Copy button next to the page title
- **Copy Selected**: Copy all checked issues/PRs (use row checkboxes to select)
- **Copy All (Current Page)**: Copy all visible issues/PRs on the current page

Copy Selected and Copy All appear in the table header beside the Open/Closed (or “X selected”) area. They stay visible when you select items—the toolbar is kept in place when GitHub switches to the bulk-action bar.

Copy actions work on both **Issues** (new "Evolving Issues" UI) and **Pull requests** (classic layout) list pages. The toolbar is placed in the table header section on both—next to the Open/Closed tabs.

List toolbar buttons use **vanilla DOM** (same clipboard path as per-row Copy) so Chrome keeps a valid user gesture for rich `clipboard.write`.

### Status badges (PR only)

PR review statuses are shown as colored text (no background):

| Status | Color |
|--------|-------|
| Approved | Green (#1a7f37) |
| Review required | Yellow (#eab308) |
| Changes requested | Red (#cf222e) |

Status badges appear on the PR list only.

### Clipboard (summary)

- **HTML:** Anchors like `<a href="https://…">Title</a>` inside a small HTML document; multiple items separated by `<br>`.
- **Plain text:** Markdown links `[title](https://…)` per item; items separated by a blank line. Empty title falls back to URL only.

See [docs/FUNCTIONALITY.md](docs/FUNCTIONALITY.md) for exact behavior and examples.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Build

```bash
npm run build
```

Output goes to `dist/`. Load that folder in Chrome as an unpacked extension.

## Development

Watch mode for live rebuilds:

```bash
npm run watch
```

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` directory

## Test

```bash
npm test
```

## Project Structure

```
src/
  content_script.tsx   # GitHub injection: vanilla list rows + toolbar; React detail Copy only
  domHelpers.ts        # DOM helpers for list header discovery (tested)
  utils.ts             # Pure helpers (tested)
  popup.tsx            # Extension popup UI
  options.tsx          # Options page
  background.ts        # Service worker
docs/
  FUNCTIONALITY.md     # Full behavior, clipboard format, examples
  ENGINEERING.md       # Priorities: security, robustness, resilience, SOLID
dist/                  # Built extension (load this in Chrome)
```

## Tech Stack

- TypeScript
- React (detail page Copy button only)
- Vanilla DOM (list rows, list toolbar, toasts, per-row Copy)
- Webpack
- Lucide React (icon on detail Copy button)
- Jest

## Performance

- Per-row Copy and list toolbar use vanilla DOM (only the detail page uses a small React root)
- Single DOM query for list processing (no duplicate `querySelectorAll`)
- MutationObserver scoped to `#repo-content-pjax-container` when available
- Detail page runs once (no observer)
- 300ms debounce for list mutations
