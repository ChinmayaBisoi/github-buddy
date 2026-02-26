import React from "react";
import { createRoot } from "react-dom/client";
import { Copy } from "lucide-react";
import {
  formatCopyPayload,
  formatCopyPayloadMultiple,
  isDetailPage,
  isIssueOrPrUrl,
  buildDetailTitle,
  matchStatusBadge,
  STATUS_STYLES,
} from "./utils";

const COPY_BUTTON_ATTR = "data-github-buddy-copy";
const TOOLBAR_ATTR = "data-github-buddy-toolbar";
const STATUS_BADGE_ATTR = "data-github-buddy-status";
const TOAST_ATTR = "data-github-buddy-toast";

const ISSUE_PR_LINKS = 'a[href*="/issues/"], a[href*="/pull/"]';
const ROW_SELECTOR = "div.Box-row, [data-testid='issue-row'], tr, li";
const DEBOUNCE_MS = 300;

const buttonStyle =
  "display:inline-flex;align-items:center;gap:3px;padding:2px 6px;margin-left:6px;background:#238636;border:none;border-radius:2px;cursor:pointer;color:#fff;font-size:11px;font-weight:500;line-height:1.2";

const COPY_ICON =
  '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

function showToast(message: string, duration = 1500) {
  const existing = document.querySelector(`[${TOAST_ATTR}]`);
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.setAttribute(TOAST_ATTR, "true");
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    padding:8px 16px;background:var(--color-canvas-default,#fff);
    color:var(--color-fg-default,#24292f);
    font-size:13px;font-weight:500;border-radius:6px;
    box-shadow:0 4px 12px rgba(0,0,0,.15);
    z-index:999999;opacity:0;transition:opacity .2s ease;
    border:1px solid var(--color-border-default,#d0d7de);
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

function createVanillaCopyButton(title: string, url: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Copy issue/PR name and URL");
  btn.title = "Copy name and URL";
  btn.style.cssText = buttonStyle;
  btn.innerHTML = COPY_ICON + '<span>Copy</span>';

  let copyTimeout: ReturnType<typeof setTimeout> | undefined;
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyToClipboard(formatCopyPayload(title, url));
      showToast("Copied!");
      btn.style.background = "#2ea043";
      copyTimeout = setTimeout(() => {
        btn.style.background = "#238636";
        copyTimeout = undefined;
      }, 1500);
    } catch (err) {
      console.error("GitHub Buddy: Copy failed", err);
    }
  });
  btn.addEventListener("mouseenter", () => {
    if (!copyTimeout) btn.style.background = "#2ea043";
  });
  btn.addEventListener("mouseleave", () => {
    if (!copyTimeout) btn.style.background = "#238636";
  });

  return btn;
}

function injectCopyButton(link: HTMLAnchorElement, href: string, title: string) {
  const row =
    link.closest("div.Box-row") ??
    link.closest('[data-testid="issue-row"]') ??
    link.closest("tr") ??
    link.closest("li");
  if (row?.querySelector(`[${COPY_BUTTON_ATTR}][data-url="${href}"]`)) return;

  const container = document.createElement("span");
  container.setAttribute(COPY_BUTTON_ATTR, "true");
  container.setAttribute("data-url", href);
  container.style.cssText = "display:inline-flex;align-items:center";
  container.appendChild(createVanillaCopyButton(title, href));
  link.parentNode?.insertBefore(container, link.nextSibling);
}

type IssuePrItem = { title: string; url: string };

function getIssuePrItems(): IssuePrItem[] {
  const links = document.querySelectorAll<HTMLAnchorElement>(ISSUE_PR_LINKS);
  const seen = new Set<string>();
  const items: IssuePrItem[] = [];
  for (let i = 0; i < links.length; i++) {
    const href = links[i].href;
    if (!isIssueOrPrUrl(href) || seen.has(href)) continue;
    seen.add(href);
    const title = links[i].textContent?.trim() ?? "";
    if (title) items.push({ title, url: href });
  }
  return items;
}

function getSelectedItems(): IssuePrItem[] {
  const checked = document.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"]:checked'
  );
  const items: IssuePrItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < checked.length; i++) {
    const cb = checked[i];
    const row =
      cb.closest("div.Box-row") ??
      cb.closest('[data-testid="issue-row"]') ??
      cb.closest("tr") ??
      cb.closest("li");
    if (!row) continue;
    const link = row.querySelector<HTMLAnchorElement>(ISSUE_PR_LINKS);
    if (!link || !isIssueOrPrUrl(link.href) || seen.has(link.href)) continue;
    seen.add(link.href);
    const title = link.textContent?.trim() ?? "";
    if (title) items.push({ title, url: link.href });
  }
  return items;
}

const buttonBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  padding: "2px 6px",
  marginLeft: "6px",
  background: "#238636",
  border: "none",
  borderRadius: "2px",
  cursor: "pointer",
  color: "#fff",
  fontSize: "11px",
  fontWeight: 500,
  lineHeight: 1.2,
};

const ListToolbar = React.memo(function ListToolbar() {
  const [status, setStatus] = React.useState<"idle" | "copied" | "error">("idle");
  const [allCount, setAllCount] = React.useState(() => getIssuePrItems().length);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    const updateCount = () => setAllCount(getIssuePrItems().length);
    updateCount();
    const container =
      document.querySelector("#repo-content-pjax-container") ??
      document.querySelector(".Box-body");
    if (!container) return () => {};
    const obs = new MutationObserver(updateCount);
    obs.observe(container, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  const handleCopy = React.useCallback(async (items: IssuePrItem[]) => {
    clearTimeout(timeoutRef.current);
    if (items.length === 0) {
      showToast("Nothing to copy");
      setStatus("error");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    try {
      await copyToClipboard(formatCopyPayloadMultiple(items));
      showToast("Copied!");
      setStatus("copied");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      console.error("GitHub Buddy: Copy failed", err);
      setStatus("error");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    }
  }, []);

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <button
        type="button"
        onClick={() => handleCopy(getSelectedItems())}
        style={buttonBaseStyle}
        title="Copy selected issues/PRs"
      >
        <Copy size={10} strokeWidth={2} />
        Copy Selected
      </button>
      <button
        type="button"
        onClick={() => handleCopy(getIssuePrItems())}
        style={buttonBaseStyle}
        title="Copy all visible issues/PRs on this page"
      >
        <Copy size={10} strokeWidth={2} />
        Copy All ({allCount})
      </button>
      {status === "copied" && (
        <span style={{ marginLeft: "6px", color: "#3fb950", fontSize: "12px" }}>
          Copied!
        </span>
      )}
      {status === "error" && (
        <span style={{ marginLeft: "6px", color: "#f85149", fontSize: "12px" }}>
          Nothing to copy
        </span>
      )}
    </span>
  );
});

function findTableHeader(): HTMLElement | null {
  // 1. Try the table header by known selectors
  const byTestId = document.querySelector<HTMLElement>(
    '[data-testid="table-header"]'
  );
  if (byTestId) return byTestId;

  // 2. Look for .Box-header inside the issues/PRs list
  const boxHeader = document.querySelector<HTMLElement>(
    ".Box .Box-header, .Box-sc- .Box-header"
  );
  if (boxHeader) return boxHeader;

  // 3. Find the "Open"/"Closed" links that live INSIDE the table (not the
  //    nav tabs). Table-header links typically sit next to a "select-all"
  //    checkbox or inside a div that also has sort/filter dropdowns.
  const allStateLinks = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="state=open"], a[href*="is%3Aopen"], a[href*="is:open"]'
  );
  for (let i = 0; i < allStateLinks.length; i++) {
    const link = allStateLinks[i];
    // The table-header version is inside a container that also has a checkbox
    const container =
      link.closest<HTMLElement>(".Box-header") ??
      link.closest<HTMLElement>('[role="row"]') ??
      link.closest<HTMLElement>("div");
    if (!container) continue;
    // Verify this container (or a sibling) has the select-all checkbox or
    // sort/filter elements — that distinguishes the table header from nav tabs
    if (
      container.querySelector('input[type="checkbox"]') ||
      container.querySelector('[aria-label*="Sort"]') ||
      container.querySelector('details') ||
      container.parentElement?.querySelector('input[type="checkbox"]')
    ) {
      return container.parentElement ?? container;
    }
  }

  return null;
}

function injectListToolbar() {
  if (document.querySelector(`[${TOOLBAR_ATTR}]`)) return;

  const toolbar = document.createElement("span");
  toolbar.setAttribute(TOOLBAR_ATTR, "true");
  toolbar.style.cssText =
    "display:inline-flex;align-items:center;gap:4px;margin-left:8px;flex-shrink:0";

  const root = createRoot(toolbar);
  root.render(<ListToolbar />);

  const header = findTableHeader();

  if (header) {
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.flexWrap = "wrap";

    // Find the state block: Open/Closed links (no selection) or "X selected" (selection).
    // Insert toolbar as its next sibling so we stay in the same spot and survive DOM replacement.
    let stateContainer: HTMLElement | null = null;
    const openLink = header.querySelector<HTMLElement>(
      'a[href*="state=open"], a[href*="is%3Aopen"], a[href*="is:open"]'
    );
    const closedLink = header.querySelector<HTMLElement>(
      'a[href*="state=closed"], a[href*="is%3Aclosed"], a[href*="is:closed"]'
    );
    const anchor = closedLink ?? openLink;
    if (anchor) stateContainer = anchor.parentElement;

    if (!stateContainer) {
      // Selected state: "12 selected" etc.
      const walk = (el: Element): HTMLElement | null => {
        if (/\d+\s*selected/.test((el as HTMLElement).textContent ?? ""))
          return el as HTMLElement;
        for (let i = 0; i < el.children.length; i++) {
          const found = walk(el.children[i]);
          if (found) return found;
        }
        return null;
      };
      const selectedEl = walk(header);
      stateContainer = selectedEl?.parentElement ?? null;
    }

    if (stateContainer && stateContainer.parentElement === header) {
      header.insertBefore(toolbar, stateContainer.nextSibling);
    } else {
      header.appendChild(toolbar);
    }
    return;
  }

  // Fallback: insert at top of repo content
  const repoContent =
    document.querySelector("#repo-content-pjax-container") ??
    document.querySelector('[data-pjax-container]') ??
    document.querySelector("main");
  if (repoContent) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:16px;padding:8px 0";
    wrapper.appendChild(toolbar);
    repoContent.insertBefore(wrapper, repoContent.firstChild);
  } else {
    document.body.prepend(toolbar);
  }
}

function processStatusBadges() {
  const rows = document.querySelectorAll(ROW_SELECTOR);
  for (let r = 0; r < rows.length; r++) {
    const candidates = rows[r].querySelectorAll("span, div, a");
    const arr: Element[] = [];
    for (let i = 0; i < candidates.length; i++) arr.push(candidates[i]);
    arr.sort((a, b) => a.children.length - b.children.length);

    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      if (el.hasAttribute(STATUS_BADGE_ATTR)) continue;
      const type = matchStatusBadge(el.textContent ?? "");
      if (!type) continue;
      const style = STATUS_STYLES[type];
      if (!style?.color) continue;
      const children = el.querySelectorAll("span, div, a, li");
      let hasChild = false;
      for (let c = 0; c < children.length; c++) {
        if (children[c] !== el && matchStatusBadge(children[c].textContent ?? "")) {
          hasChild = true;
          break;
        }
      }
      if (hasChild) continue;

      el.setAttribute(STATUS_BADGE_ATTR, "true");
      const color = style.color;
      (el as HTMLElement).style.setProperty("color", color, "important");
      if (style.fontSize) (el as HTMLElement).style.fontSize = style.fontSize;
      if (style.fontWeight)
        (el as HTMLElement).style.setProperty("font-weight", style.fontWeight);
      const desc = el.querySelectorAll("span, div, a, p");
      for (let d = 0; d < desc.length; d++) {
        (desc[d] as HTMLElement).style.setProperty("color", color, "important");
      }
    }
  }
}

function processListPage(links: NodeListOf<HTMLAnchorElement>) {
  const processed = new Set<string>();
  let hasValid = false;

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const href = link.href;
    if (!isIssueOrPrUrl(href)) continue;
    hasValid = true;
    if (processed.has(href)) continue;
    processed.add(href);
    const title = link.textContent?.trim() ?? "";
    if (!title) continue;
    injectCopyButton(link, href, title);
  }

  if (!hasValid) return;

  injectListToolbar();
  processStatusBadges();
}

const CopyButton = React.memo(function CopyButton({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleClick = React.useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await copyToClipboard(formatCopyPayload(title, url));
        showToast("Copied!");
        setCopied(true);
        timeoutRef.current = setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        console.error("GitHub Buddy: Copy failed", err);
      }
    },
    [title, url]
  );

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Copy issue/PR name and URL"
      title="Copy name and URL"
      style={{
        ...buttonBaseStyle,
        background: copied ? "#2ea043" : "#238636",
      }}
      onMouseEnter={(e) => {
        if (!copied) e.currentTarget.style.background = "#2ea043";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = copied ? "#2ea043" : "#238636";
      }}
    >
      <Copy size={10} strokeWidth={2} />
      <span>Copy</span>
    </button>
  );
});

function processDetailPage() {
  const titleEl = document.querySelector(
    "h1.gh-header-title span, h1 span.js-issue-title, .gh-header-title"
  );
  const fallback = document.querySelector("h1");
  const target = (titleEl ?? fallback) as HTMLElement | null;
  if (!target) return;

  const url = window.location.href;
  const titleText = (titleEl ?? target).textContent ?? "";
  const title = buildDetailTitle(titleText, url);

  if (!title || (!url.includes("/issues/") && !url.includes("/pull/"))) return;

  if (document.querySelector(`[${COPY_BUTTON_ATTR}="detail"]`)) return;

  const container = document.createElement("span");
  container.setAttribute(COPY_BUTTON_ATTR, "detail");
  container.style.cssText =
    "display:inline-flex;align-items:center;margin-left:8px;vertical-align:middle";

  const root = createRoot(container);
  root.render(<CopyButton title={title} url={url} />);
  target.appendChild(container);
}

function run() {
  const pathname = window.location.pathname;
  if (isDetailPage(pathname)) {
    processDetailPage();
    return;
  }

  const links = document.querySelectorAll<HTMLAnchorElement>(ISSUE_PR_LINKS);
  for (let i = 0; i < links.length; i++) {
    if (isIssueOrPrUrl(links[i].href)) {
      processListPage(links);
      return;
    }
  }
}

function observeAndRun() {
  const pathname = window.location.pathname;
  if (isDetailPage(pathname)) {
    run();
    return;
  }

  let debounceTimer: ReturnType<typeof setTimeout>;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(run, DEBOUNCE_MS);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  run();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeAndRun);
} else {
  observeAndRun();
}
