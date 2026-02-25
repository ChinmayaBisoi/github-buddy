# GitHub Buddy

Chrome extension that adds copy buttons and status badges to GitHub issues and pull requests. Click to copy the full title (with issue/PR number) and URL in one action.

## Features

### Copy actions

- **Per-row Copy button**: Green compact button next to each issue/PR title in list views
- **Issue/PR detail page**: Copy button next to the page title
- **Copy Selected**: Copy all checked issues/PRs (use row checkboxes to select)
- **Copy All (Current Page)**: Copy all visible issues/PRs on the current page

Copy Selected and Copy All appear in the table header beside the Open/Closed filter tabs.

### Status badges (PR only)

PR review statuses are shown as colored text (no background):

| Status | Color |
|--------|-------|
| Approved | Green (#1a7f37) |
| Review required | Yellow (#eab308) |
| Changes requested | Red (#cf222e) |

Copy actions work on both issues and pull requests. Status badges appear on the PR list.

Copied format (single):
```
Title of the issue or PR #123
https://github.com/owner/repo/issues/123
```

Multiple items are separated by a blank line:
```
Title 1 #123
https://github.com/owner/repo/issues/123

Title 2 #124
https://github.com/owner/repo/issues/124
```

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
  content_script.tsx   # Injected into GitHub pages (vanilla DOM for list rows, React for toolbar/detail)
  utils.ts             # Pure helpers (tested)
  popup.tsx            # Extension popup UI
  options.tsx          # Options page
  background.ts        # Service worker
dist/                  # Built extension (load this in Chrome)
```

## Tech Stack

- TypeScript
- React (toolbar, detail page)
- Vanilla DOM (per-row Copy buttons for performance)
- Webpack
- Lucide React (icons for toolbar/detail)
- Jest

## Performance

- Per-row Copy buttons use vanilla DOM (no React roots per row)
- Single DOM query for list processing (no duplicate `querySelectorAll`)
- MutationObserver scoped to `#repo-content-pjax-container` when available
- Detail page runs once (no observer)
- 300ms debounce for list mutations
