import React from "react";
import { createRoot } from "react-dom/client";
import { Copy } from "lucide-react";
import { formatCopyPayload, isDetailPage, isIssueOrPrUrl, buildDetailTitle } from "./utils";

const COPY_BUTTON_ATTR = "data-github-buddy-copy";

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
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
        marginLeft: "6px",
        background: "transparent",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        color: copied ? "#3fb950" : "var(--color-fg-muted, #8b949e)",
        verticalAlign: "middle",
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.color = "var(--color-accent-fg, #58a6ff)";
          e.currentTarget.style.background = "var(--color-accent-subtle, rgba(56,139,253,0.15))";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = copied ? "#3fb950" : "var(--color-fg-muted, #8b949e)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Copy size={14} strokeWidth={2} />
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
