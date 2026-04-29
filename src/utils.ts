/** Pure utilities for GitHub Buddy content script. */

/** Pathname is a repo issues or pulls page (list or detail). No other pages. */
export function isIssuesOrPullsPage(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return /^\/[^/]+\/[^/]+\/(issues(\/\d+)?|pulls|pull\/\d+)$/.test(path);
}

export function isDetailPage(pathname: string): boolean {
  return /\/issues\/\d+$/.test(pathname) || /\/pull\/\d+$/.test(pathname);
}

export function isIssueOrPrUrl(href: string): boolean {
  return /\/issues\/\d+$/.test(href) || /\/pull\/\d+$/.test(href);
}

/** Escape text for use inside an HTML attribute or text node. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Markdown link label escapes for CommonMark-style pastes (Slack, many editors). */
function escapeMarkdownLinkText(title: string): string {
  return title.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}

/** Plain clipboard line: markdown link so title stays one line and linkifies where supported. */
export function formatCopyPayload(title: string, url: string): string {
  const t = title.trim();
  if (!t) return url;
  return `[${escapeMarkdownLinkText(t)}](${url})`;
}

export function formatCopyPayloadMultiple(items: Array<{ title: string; url: string }>): string {
  return items.map(({ title, url }) => formatCopyPayload(title, url)).join("\n\n");
}

/** Rich HTML for one clickable title (paste into Gmail, Docs, Notion, etc.). */
export function formatCopyPayloadHtml(title: string, url: string): string {
  const t = title.trim();
  const label = t ? escapeHtml(t) : escapeHtml(url);
  const href = escapeHtml(url);
  return `<a href="${href}">${label}</a>`;
}

export function formatCopyPayloadMultipleHtml(
  items: Array<{ title: string; url: string }>
): string {
  return items.map(({ title, url }) => formatCopyPayloadHtml(title, url)).join("<br>");
}

export function buildDetailTitle(titleText: string, url: string): string {
  const issueNum = url.match(/\/(?:issues|pull)\/(\d+)/)?.[1];
  const trimmed = titleText.trim();
  return trimmed.includes("#") ? trimmed : `${trimmed}${issueNum ? ` #${issueNum}` : ""}`;
}

export type StatusBadgeType = "approved" | "review-required" | "changes-requested";

/** Status badge colors for PR review states. */
export const STATUS_STYLES: Record<
  StatusBadgeType,
  { color: string; fontSize: string; fontWeight: string }
> = {
  approved: { color: "#1a7f37", fontSize: "11px", fontWeight: "600" },
  "review-required": { color: "#eab308", fontSize: "11px", fontWeight: "600" },
  "changes-requested": { color: "#cf222e", fontSize: "11px", fontWeight: "600" },
};

/** Returns the status badge type if the text matches a PR review status. */
export function matchStatusBadge(text: string): StatusBadgeType | null {
  const t = text.trim();
  if (t === "Approved" || t === "• Approved") return "approved";
  if (t === "Review required" || t === "• Review required") return "review-required";
  if (
    t === "Changes requested" ||
    t === "• Changes requested" ||
    t === "Requested Changes" ||
    t === "• Requested Changes"
  )
    return "changes-requested";
  return null;
}
