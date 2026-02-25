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
