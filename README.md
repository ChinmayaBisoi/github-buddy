# GitHub Buddy

Chrome extension that adds copy buttons and status badges to GitHub issues and pull requests. Click to copy the full title (with issue/PR number) and URL in one action.

## Features

### Copy actions

- **Per-row Copy button**: Green compact button next to each issue/PR title in list views
- **Issue/PR detail page**: Copy button next to the page title
- **Copy Selected**: Copy all checked issues/PRs (use row checkboxes to select)
- **Copy All**: Copy all visible issues/PRs on the current page

Copy All and Copy Selected appear in the table header beside the Open/Closed filter tabs.

### Status badges (PR only)

PR review statuses are styled as pill badges:

| Status | Style |
|--------|-------|
| Approved | Green background |
| Review required | Off-white background |
| Changes requested | Red background |

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
  content_script.tsx   # Injected into GitHub pages
  utils.ts             # Pure helpers (tested)
  popup.tsx            # Extension popup UI
  options.tsx          # Options page
  background.ts        # Service worker
dist/                  # Built extension (load this in Chrome)
```

## Tech Stack

- TypeScript
- React
- Webpack
- Lucide React (icons)
- Jest
