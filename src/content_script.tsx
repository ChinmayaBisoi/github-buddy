import React from "react";
import { createRoot } from "react-dom/client";
import { Copy } from "lucide-react";
import {
  formatCopyPayload,
  formatCopyPayloadMultiple,
  isDetailPage,
  isIssueOrPrUrl,
  buildDetailTitle,
} from "./utils";

const COPY_BUTTON_ATTR = "data-github-buddy-copy";
const TOOLBAR_ATTR = "data-github-buddy-toolbar";

const buttonBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  padding: "4px 8px",
  marginLeft: "6px",
  background: "#238636",
  border: "none",
  borderRadius: "2px",
  cursor: "pointer",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 500,
  verticalAlign: "middle",
};

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

function CopyButton({
  title,
  url,
  onCopied,
}: {
  title: string;
  url: string;
  onCopied: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = formatCopyPayload(title, url);
    try {
      await copyToClipboard(text);
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("GitHub Buddy: Copy failed", err);
    }
  };

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
      <Copy size={12} strokeWidth={2} />
      <span>Copy</span>
    </button>
  );
}

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

function ListToolbar() {
  const [status, setStatus] = React.useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async (items: IssuePrItem[]) => {
    if (items.length === 0) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    try {
      await copyToClipboard(formatCopyPayloadMultiple(items));
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      console.error("GitHub Buddy: Copy failed", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <button
        type="button"
        onClick={() => handleCopy(getSelectedItems())}
        style={buttonBaseStyle}
        title="Copy selected issues/PRs"
      >
        <Copy size={12} strokeWidth={2} />
        Copy Selected
      </button>
      <button
        type="button"
        onClick={() => handleCopy(getIssuePrItems())}
        style={buttonBaseStyle}
        title="Copy all visible issues/PRs on this page"
      >
        <Copy size={12} strokeWidth={2} />
        Copy All
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
}

function injectListToolbar() {
  if (document.querySelector(`[${TOOLBAR_ATTR}]`)) return;

  const toolbar = document.createElement("span");
  toolbar.setAttribute(TOOLBAR_ATTR, "true");
  toolbar.style.display = "inline-flex";
  toolbar.style.alignItems = "center";

  const root = createRoot(toolbar);
  root.render(<ListToolbar />);

  const target =
    document.querySelector(".table-list-header, .issues-list-actions, .subnav") ??
    document.querySelector('[data-testid="issue-list-filters"]') ??
    document.querySelector(".d-flex.flex-wrap.gap-2") ??
    document.querySelector(".flex-wrap.items-center");
  if (target) {
    target.appendChild(toolbar);
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

function run() {
  if (isDetailPage(window.location.pathname)) {
    processDetailPage();
  } else {
    processListPage();
  }
}

run();

let debounceTimer: ReturnType<typeof setTimeout>;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(run, 150);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
