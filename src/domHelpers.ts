/**
 * DOM helpers for the content script. Scoped to a root element (e.g. repo content)
 * so we don't match nav tabs. Used for finding the issues/PR list header.
 */

/**
 * Finds the table header row that contains Open/Closed (or "X selected") on
 * the issues or pull requests list page. All lookups are scoped to `scope`
 * so the top nav is never matched.
 */
export function findTableHeader(scope: Element): HTMLElement | null {
  // 1. Try the table header by known selectors (old PRs layout)
  const byTestId = scope.querySelector<HTMLElement>(
    '[data-testid="table-header"]'
  );
  if (byTestId) return byTestId;

  // 2. New Issues UI ("Evolving Issues"): the Open/Closed tabs live inside
  //    a metadata container whose id ends with "-list-view-metadata".
  const listViewMeta = scope.querySelector<HTMLElement>(
    '[id$="-list-view-metadata"]'
  );
  if (listViewMeta) return listViewMeta;

  // 3. Look for .Box-header inside the issues/PRs list (old layout)
  const boxHeader = scope.querySelector<HTMLElement>(
    ".Box .Box-header, .Box-sc- .Box-header"
  );
  if (boxHeader) return boxHeader;

  // 4. Find the "Open"/"Closed" links that live INSIDE the table (not the
  //    nav tabs). Table-header links typically sit next to a "select-all"
  //    checkbox or inside a div that also has sort/filter dropdowns.
  const allStateLinks = scope.querySelectorAll<HTMLAnchorElement>(
    'a[href*="state=open"], a[href*="is%3Aopen"], a[href*="is:open"]'
  );
  for (let i = 0; i < allStateLinks.length; i++) {
    const link = allStateLinks[i];
    const container =
      link.closest<HTMLElement>(".Box-header") ??
      link.closest<HTMLElement>('[role="row"]') ??
      link.closest<HTMLElement>("div");
    if (!container) continue;
    if (
      container.querySelector('input[type="checkbox"]') ||
      container.querySelector('[aria-label*="Sort"]') ||
      container.querySelector('details') ||
      container.parentElement?.querySelector('input[type="checkbox"]')
    ) {
      return container.parentElement ?? container;
    }
  }

  // 5. Issues page (and some PR layouts): state links in a flex row without
  //    .Box-header; use the parent of the Open/Closed group as header.
  for (let i = 0; i < allStateLinks.length; i++) {
    const link = allStateLinks[i];
    const parent = link.closest<HTMLElement>("div");
    if (!parent) continue;
    const hasClosed = parent.querySelector(
      'a[href*="state=closed"], a[href*="is%3Aclosed"], a[href*="is:closed"]'
    );
    if (hasClosed || parent.textContent?.includes("Closed")) {
      const headerCandidate = parent.parentElement ?? parent;
      if (scope.contains(headerCandidate)) return headerCandidate;
    }
  }

  // 6. Issues/PR list: find the table section by locating a list row, then get
  //    the header row (preceding sibling or first child of list container).
  const listRow =
    scope.querySelector('[data-testid="issue-row"]') ??
    scope.querySelector(".Box-row");
  if (listRow) {
    const listContainer = listRow.parentElement;
    if (!listContainer) return null;
    let prev: Element | null = listContainer.previousElementSibling;
    while (prev) {
      const el = prev as HTMLElement;
      const hasState =
        el.querySelector('a[href*="state=open"], a[href*="is%3Aopen"]') ||
        /\d+\s*selected|Open|Closed/.test(el.textContent ?? "");
      if (hasState && scope.contains(el)) return el;
      prev = prev.previousElementSibling;
    }
    const firstChild = listContainer.firstElementChild;
    if (firstChild && firstChild !== listRow) {
      const el = firstChild as HTMLElement;
      const hasState =
        el.querySelector('a[href*="state=open"], a[href*="is%3Aopen"], a[href*="state=closed"], a[href*="is%3Aclosed"]') ||
        /\d+\s*selected|Open|Closed/.test(el.textContent ?? "");
      if (hasState) return el;
    }
  }

  return null;
}
