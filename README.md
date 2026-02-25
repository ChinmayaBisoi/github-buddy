# GitHub Buddy

Chrome extension that adds a copy button to GitHub issues and pull requests. Click to copy the full title (with issue/PR number) and URL in one action.

## Features

- **Issues list** (`/owner/repo/issues`): Green Copy button next to each issue title
- **Pull requests list** (`/owner/repo/pulls`): Green Copy button next to each PR title
- **Issue/PR detail page**: Copy button next to the page title
- **Copy Selected**: Copy all checked issues/PRs (use row checkboxes to select)
- **Copy All**: Copy all visible issues/PRs on the current page

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
