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
  verticalAlign: "middle",
};

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

const CopyButton = React.memo(function CopyButton({
  title,
  url,
  onCopied,
}: {
  title: string;
  url: string;
  onCopied: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleClick = React.useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = formatCopyPayload(title, url);
    try {
      await copyToClipboard(text);
      setCopied(true);
      onCopied();
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("GitHub Buddy: Copy failed", err);
    }
  }, [title, url, onCopied]);

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

function injectCopyButton(link: HTMLAnchorElement) {
  const href = link.href;
  if (!isIssueOrPrUrl(href)) return;

  const title = link.textContent?.trim() ?? "";
  if (!title) return;

  const row =
    link.closest("div.Box-row") ??
    link.closest('[data-testid="issue-row"]') ??
    link.closest("tr") ??
    link.closest("li");
  if (row?.querySelector(`[${COPY_BUTTON_ATTR}][data-url="${href}"]`)) return;

  const container = document.createElement("span");
  container.setAttribute(COPY_BUTTON_ATTR, "true");
  container.setAttribute("data-url", href);
  container.style.display = "inline-flex";
  container.style.alignItems = "center";

  const root = createRoot(container);
  root.render(
    <CopyButton title={title} url={href} onCopied={() => {}} />
  );

  link.parentNode?.insertBefore(container, link.nextSibling);
}

type IssuePrItem = { title: string; url: string };

function getIssuePrItems(): IssuePrItem[] {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/issues/"], a[href*="/pull/"]'
  );
  const seen = new Set<string>();
  const items: IssuePrItem[] = [];
  links.forEach((link) => {
    const href = link.href;
    if (!isIssueOrPrUrl(href) || seen.has(href)) return;
    seen.add(href);
    const title = link.textContent?.trim() ?? "";
    if (title) items.push({ title, url: href });
  });
  return items;
}

function getSelectedItems(): IssuePrItem[] {
  const checked = document.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"]:checked'
  );
  const items: IssuePrItem[] = [];
  const seen = new Set<string>();
  checked.forEach((cb) => {
    const row =
      cb.closest("div.Box-row") ??
      cb.closest('[data-testid="issue-row"]') ??
      cb.closest("tr") ??
      cb.closest("li");
    if (!row) return;
    const link = row.querySelector<HTMLAnchorElement>(
      'a[href*="/issues/"], a[href*="/pull/"]'
    );
    if (!link || !isIssueOrPrUrl(link.href) || seen.has(link.href)) return;
    seen.add(link.href);
    const title = link.textContent?.trim() ?? "";
    if (title) items.push({ title, url: link.href });
  });
  return items;
}

const toolbarStatusStyles = {
  copied: { marginLeft: "6px", color: "#3fb950", fontSize: "12px" } as React.CSSProperties,
  error: { marginLeft: "6px", color: "#f85149", fontSize: "12px" } as React.CSSProperties,
};

const toolbarWrapperStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

const ListToolbar = React.memo(function ListToolbar() {
  const [status, setStatus] = React.useState<"idle" | "copied" | "error">("idle");
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleCopy = React.useCallback(async (items: IssuePrItem[]) => {
    clearTimeout(timeoutRef.current);
    if (items.length === 0) {
      setStatus("error");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    try {
      await copyToClipboard(formatCopyPayloadMultiple(items));
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
    <span style={toolbarWrapperStyle}>
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
        Copy All (Current Page)
      </button>
      {status === "copied" && (
        <span style={toolbarStatusStyles.copied}>Copied!</span>
      )}
      {status === "error" && (
        <span style={toolbarStatusStyles.error}>Nothing to copy</span>
      )}
    </span>
  );
});

function injectListToolbar() {
  if (document.querySelector(`[${TOOLBAR_ATTR}]`)) return;

  const toolbar = document.createElement("span");
  toolbar.setAttribute(TOOLBAR_ATTR, "true");
  toolbar.style.display = "inline-flex";
  toolbar.style.alignItems = "center";
  toolbar.style.gap = "8px";
  toolbar.style.marginLeft = "12px";
  toolbar.style.flexShrink = "0";

  const root = createRoot(toolbar);
  root.render(<ListToolbar />);

  const closedLink = document.querySelector<HTMLElement>(
    'a[href*="state=closed"], a[href*="is%3Aclosed"], a[href*="is:closed"]'
  );
  const openLink = document.querySelector<HTMLElement>(
    'a[href*="state=open"], a[href*="is%3Aopen"], a[href*="is:open"]'
  );
  const insertAfter =
    closedLink ?? openLink ?? document.querySelector('nav a[href*="state="]');

  if (insertAfter?.parentElement) {
    const parent = insertAfter.parentElement;
    const next = insertAfter.nextElementSibling;
    if (next) {
      parent.insertBefore(toolbar, next);
    } else {
      parent.appendChild(toolbar);
    }
  } else {
    const stateFilter =
      document.querySelector(".UnderlineNav-body") ??
      document.querySelector('[role="tablist"]') ??
      document.querySelector(".table-list-header, .subnav") ??
      document.querySelector('[data-testid="issue-list-filters"]');
    if (stateFilter) {
      stateFilter.appendChild(toolbar);
    } else {
      const repoContent = document.querySelector("#repo-content-pjax-container");
      if (repoContent) {
        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "12px";
        wrapper.appendChild(toolbar);
        repoContent.insertBefore(wrapper, repoContent.firstChild);
      }
    }
  }
}

function processStatusBadges() {
  const rows = document.querySelectorAll(
    "div.Box-row, [data-testid='issue-row'], tr.js-navigation-item, li.js-issue-row"
  );

  const match = (text: string) => {
    const type = matchStatusBadge(text);
    return type ? STATUS_STYLES[type] : null;
  };

  const process = (el: Element) => {
    if (el.hasAttribute(STATUS_BADGE_ATTR)) return;
    const text = el.textContent ?? "";
    const style = match(text);
    if (!style || !style.color) return;
    const hasMatchingChild = Array.from(el.querySelectorAll("span, div, a, li")).some(
      (c) => c !== el && match(c.textContent ?? "")
    );
    if (hasMatchingChild) return;

    el.setAttribute(STATUS_BADGE_ATTR, "true");
    const color = style.color as string;
    const htmlEl = el as HTMLElement;
    htmlEl.style.setProperty("color", color, "important");
    if (style.fontSize) htmlEl.style.fontSize = style.fontSize as string;
    if (style.fontWeight) htmlEl.style.setProperty("font-weight", style.fontWeight);
    el.querySelectorAll("span, div, a, p").forEach((desc) => {
      (desc as HTMLElement).style.setProperty("color", color, "important");
    });
  };

  rows.forEach((row) => {
    const candidates = Array.from(row.querySelectorAll("span, div, a, li"));
    const withCount = candidates.map((el) => ({
      el,
      count: el.querySelectorAll("*").length,
    }));
    withCount.sort((a, b) => a.count - b.count);
    withCount.forEach(({ el }) => process(el));
  });
}

function processListPage() {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/issues/"], a[href*="/pull/"]'
  );

  const processed = new Set<string>();

  links.forEach((link) => {
    const href = link.href;
    if (!isIssueOrPrUrl(href)) return;
    if (processed.has(href)) return;
    processed.add(href);
    injectCopyButton(link);
  });

  injectListToolbar();
  processStatusBadges();
}

function processDetailPage() {
  const titleEl = document.querySelector("h1.gh-header-title span, h1 span.js-issue-title, .gh-header-title");
  const fallback = document.querySelector("h1");
  const target = titleEl ?? fallback;
  if (!target) return;

  const url = window.location.href;
  const titleText = (titleEl ?? target).textContent ?? "";
  const title = buildDetailTitle(titleText, url);

  if (!title || (!url.includes("/issues/") && !url.includes("/pull/"))) return;

  const existing = document.querySelector(`[${COPY_BUTTON_ATTR}="detail"]`);
  if (existing) return;

  const container = document.createElement("span");
  container.setAttribute(COPY_BUTTON_ATTR, "detail");
  container.style.display = "inline-flex";
  container.style.alignItems = "center";
  container.style.marginLeft = "8px";
  container.style.verticalAlign = "middle";

  const root = createRoot(container);
  root.render(
    <CopyButton title={title} url={url} onCopied={() => {}} />
  );

  target.appendChild(container);
}

function isListReady(): boolean {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/issues/"], a[href*="/pull/"]'
  );
  return Array.from(links).some(
    (a) => isIssueOrPrUrl(a.href)
  );
}

function run() {
  if (isDetailPage(window.location.pathname)) {
    processDetailPage();
  } else {
    if (!isListReady()) return;
    processListPage();
  }
}

let debounceTimer: ReturnType<typeof setTimeout>;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(run, 150);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

run();
