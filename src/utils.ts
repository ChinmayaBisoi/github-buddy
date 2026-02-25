/** Pure utilities for GitHub Buddy content script. */

export function isDetailPage(pathname: string): boolean {
  return /\/issues\/\d+$/.test(pathname) || /\/pull\/\d+$/.test(pathname);
}

export function isIssueOrPrUrl(href: string): boolean {
  return /\/issues\/\d+$/.test(href) || /\/pull\/\d+$/.test(href);
}

export function formatCopyPayload(title: string, url: string): string {
  return `${title}\n${url}`;
}

export function formatCopyPayloadMultiple(items: Array<{ title: string; url: string }>): string {
  return items.map(({ title, url }) => formatCopyPayload(title, url)).join("\n\n");
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
